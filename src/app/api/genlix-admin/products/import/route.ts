import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/admin/auth";
import { isSameOriginRequest } from "@/lib/admin/request-origin";
import { applyProductImport, planProductImport, ProductSpreadsheetError } from "@/lib/cms/product-spreadsheet";
import { PRODUCT_IMPORT_MAX_BYTES, type ProductImportMode } from "@/lib/cms/product-spreadsheet-fields";
import { loadCmsSnapshot, mutateCmsContent } from "@/lib/cms/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function boundedFormData(request: Request) {
  const limit = PRODUCT_IMPORT_MAX_BYTES + 65_536;
  if (Number(request.headers.get("content-length")) > limit || !request.body || !request.headers.get("content-type")?.startsWith("multipart/form-data")) throw new ProductSpreadsheetError("Выберите Excel-файл размером до 3 МБ.");
  const reader = request.body.getReader(), chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const result = await reader.read();
      if (result.done) break;
      size += result.value.length;
      if (size > limit) { await reader.cancel(); throw new ProductSpreadsheetError("Файл должен быть не больше 3 МБ."); }
      chunks.push(result.value);
    }
  } finally { reader.releaseLock(); }
  return new Request(request.url, { method: "POST", headers: { "Content-Type": request.headers.get("content-type")! }, body: new Uint8Array(Buffer.concat(chunks)) }).formData();
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return Response.json({ error: "Сессия истекла. Войдите в админку и повторите загрузку." }, { status: 401 });
  if (!isSameOriginRequest(request)) return Response.json({ error: "Запрос должен быть отправлен из админки этого сайта." }, { status: 403 });
  try {
    const form = await boundedFormData(request), file = form.get("file"), mode = form.get("mode"), action = form.get("action");
    if (!(file instanceof File) || !file.size || !file.name.toLowerCase().endsWith(".xlsx")) throw new ProductSpreadsheetError("Выберите заполненный файл .xlsx из нашего шаблона.");
    if (file.size > PRODUCT_IMPORT_MAX_BYTES) throw new ProductSpreadsheetError("Файл должен быть не больше 3 МБ.");
    if (mode !== "replace" && mode !== "full" || action !== "preview" && action !== "apply") throw new ProductSpreadsheetError("Выберите режим импорта и сначала проверьте файл.");
    const loaded = await loadCmsSnapshot();
    if (!loaded.writable) return Response.json({ error: loaded.warning ?? "Хранилище доступно только для чтения." }, { status: 409 });
    const revision = loaded.snapshot.revision;
    if (action === "apply" && String(form.get("revision")) !== String(revision)) return Response.json({ error: "Каталог изменился после проверки. Проверьте файл ещё раз." }, { status: 409 });
    const plan = await planProductImport(Buffer.from(await file.arrayBuffer()), loaded.snapshot.content, revision, mode as ProductImportMode);
    if (action === "preview") return Response.json({ preview: plan.preview }, { headers: { "Cache-Control": "no-store" } });
    if (form.get("fingerprint") !== plan.preview.fingerprint) throw new ProductSpreadsheetError("Файл или режим изменился после проверки. Проверьте файл ещё раз.");
    if (!plan.preview.canApply) return Response.json({ error: "Исправьте ошибки в файле перед импортом.", preview: plan.preview }, { status: 400 });
    if (!plan.preview.counts.create && !plan.preview.counts.update && !plan.preview.counts.publish && !plan.preview.counts.archive) return Response.json({ success: true, revision, unchanged: true, counts: plan.preview.counts });
    const saved = await mutateCmsContent(revision, session.username, `Импорт Excel: ${mode === "full" ? "полное обновление каталога" : "замена отдельных товаров"} (${file.name.slice(0, 180)})`, content => applyProductImport(content, plan));
    try {
      for (const route of ["/", "/catalog/meat", "/catalog/meat/beef", "/catalog/meat/lamb", "/catalog/bird", "/catalog/beer", "/catalog/water", "/genlix-admin/products"]) revalidatePath(route);
      revalidatePath("/catalog/meat/[species]", "page");
      // Invalidate newly created product URLs as well as changed and archived ones.
      revalidatePath("/catalog/product/[slug]", "page");
    } catch (error) { console.error("Excel import saved, cache invalidation failed", error); }
    return Response.json({ success: true, revision: saved.revision, counts: plan.preview.counts });
  } catch (error) {
    if (error instanceof ProductSpreadsheetError) return Response.json({ error: error.message }, { status: 400 });
    if (error instanceof Error && /revision_conflict|cms revision conflict|40001/.test(error.message)) return Response.json({ error: "Каталог изменился после проверки. Проверьте файл ещё раз." }, { status: 409 });
    console.error("Product Excel import failed", error);
    return Response.json({ error: "Не удалось импортировать товары. Данные не изменены. Попробуйте ещё раз." }, { status: 500 });
  }
}
