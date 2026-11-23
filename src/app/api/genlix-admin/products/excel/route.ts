import { getAdminSession } from "@/lib/admin/auth";
import { exportProductSpreadsheet } from "@/lib/cms/product-spreadsheet";
import { loadAdminCmsSnapshot } from "@/lib/cms/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!await getAdminSession()) return Response.json({ error: "Войдите в админку." }, { status: 401 });
  const type = new URL(request.url).searchParams.get("type");
  if (type !== "template" && type !== "catalog") return Response.json({ error: "Неизвестный тип выгрузки." }, { status: 400 });
  try {
    const cms = type === "catalog" ? await loadAdminCmsSnapshot() : null;
    if (type === "catalog" && !cms?.writable) {
      return Response.json({ error: cms?.warning ?? "База данных не отвечает. Повторите попытку." }, { status: 503 });
    }
    const file = await exportProductSpreadsheet(cms?.snapshot.content.products);
    return new Response(new Uint8Array(file), { headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="genlix-${type === "catalog" ? "catalog" : "products-template"}.xlsx"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    } });
  } catch (error) {
    console.error("Product Excel download failed", error);
    return Response.json({ error: "Не удалось подготовить Excel-файл. Попробуйте ещё раз." }, { status: 500 });
  }
}
