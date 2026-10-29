import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const require = createRequire(import.meta.url);
const { createJiti } = createRequire(require.resolve("eslint/package.json"))("jiti");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jiti = createJiti(import.meta.url, { alias: { "@": path.join(root, "src") }, fsCache: false });
const engine = await jiti.import("../src/lib/cms/product-spreadsheet.ts");
const config = await jiti.import("../src/lib/cms/product-spreadsheet-fields.ts");
const { buildLegacyCmsSeed } = await jiti.import("../src/lib/cms/seed.ts");
const { normalizeCmsContent } = await jiti.import("../src/lib/cms/types.ts");
const { isSameOriginRequest } = await jiti.import("../src/lib/admin/request-origin.ts");
const seed = buildLegacyCmsSeed();
const template = await engine.exportProductSpreadsheet();

async function workbook(buffer = template) { return engine.readProductSpreadsheetWorkbook(buffer); }
function set(wb, category, row, key, value) { const fields = config.productSpreadsheetFields(category); wb.getWorksheet(config.PRODUCT_SHEET_NAMES[category]).getRow(row).getCell(fields.findIndex(field => field.key === key) + 1).value = value; }
function put(wb, entity, row = 3, patch = {}) {
  const values = { ...engine.productSpreadsheetValues(entity), ...patch };
  const category = (entity.published ?? entity.draft).category;
  config.productSpreadsheetFields(category).forEach(field => set(wb, category, row, field.key, values[field.key] ?? ""));
}
async function file(wb) { return Buffer.from(await wb.xlsx.writeBuffer()); }
const first = seed.products.find(entity => entity.published?.category === "meat");

test("template contains the exact category contracts, native dropdown references, text GTIN and frozen headings", async () => {
  const wb = await workbook();
  assert.equal(wb.getWorksheet("Инструкция").getCell("B1").value, config.PRODUCT_SHEET_VERSION);
  assert.ok(wb.getWorksheet("Примеры"));
  for (const category of config.PRODUCT_SHEET_CATEGORIES) {
    const fields = config.productSpreadsheetFields(category), sheet = wb.getWorksheet(config.PRODUCT_SHEET_NAMES[category]);
    assert.deepEqual(sheet.getRow(1).values.slice(1), fields.map(field => field.label));
    assert.equal(sheet.getRow(3).hasValues, false);
    assert.match(sheet.getCell("E2").value, /^Необязательно\./);
    assert.ok(sheet.views.some(view => view.state === "frozen" && view.ySplit === 2 && view.xSplit === 3));
    for (const field of fields.filter(field => field.choices)) {
      const cell = sheet.getRow(3).getCell(fields.indexOf(field) + 1);
      assert.equal(cell.dataValidation.type, "list");
      assert.match(cell.dataValidation.formulae[0], /INDIRECT/);
    }
  }
  const fields = config.productSpreadsheetFields("meat");
  assert.equal(wb.getWorksheet("Мясо").getRow(3).getCell(fields.findIndex(field => field.key === "meatGtin") + 1).numFmt, "@");
});

test("export/reimport of published catalog is byte-for-byte unchanged, preserving old optional metadata and URLs", async () => {
  const bytes = await engine.exportProductSpreadsheet(seed.products);
  const plan = await engine.planProductImport(bytes, seed, 7, "replace");
  assert.deepEqual(plan.preview.issues, []);
  assert.equal(plan.preview.counts.unchanged, seed.products.filter(entity => entity.status === "published").length);
  const copy = structuredClone(seed);
  engine.applyProductImport(copy, plan);
  assert.equal(JSON.stringify(copy.products), JSON.stringify(seed.products));
  assert.equal(JSON.stringify(copy.news), JSON.stringify(seed.news));
});

test("previous V1 files can create and update products without photos, and blanks survive export/reimport", async () => {
  const originalTemplate = await readFile(path.join(root, "assets/templates/genlix-products-v1.xlsx"));
  const wb = await workbook(originalTemplate);
  put(wb, first, 3, { image: "", images: "" });
  put(wb, first, 4, { id: "", slug: "", sortOrder: "", title: "Новый товар без фото", image: "", images: "" });
  const plan = await engine.planProductImport(await file(wb), seed, 7, "replace");
  assert.deepEqual(plan.preview.issues, []);
  assert.equal(plan.preview.counts.create, 1);
  assert.equal(plan.preview.counts.update, 1);
  const copy = structuredClone(seed);
  engine.applyProductImport(copy, plan);
  normalizeCmsContent(copy);
  for (const entity of copy.products.filter(entity => entity.id === first.id || entity.published?.catalog.title === "Новый товар без фото")) {
    assert.equal(entity.published.catalog.image, "");
    assert.deepEqual(entity.published.detail.images, []);
    assert.equal(engine.productSpreadsheetValues(entity).image, "");
    assert.equal(engine.productSpreadsheetValues(entity).images, "");
  }
  const roundTrip = await engine.planProductImport(await engine.exportProductSpreadsheet(copy.products), copy, 8, "replace");
  assert.deepEqual(roundTrip.preview.issues, []);
  assert.equal(roundTrip.preview.counts.unchanged, copy.products.length);
});

test("replacement updates only referenced goods, adds new ones, retains news and fixed product URLs", async () => {
  const wb = await workbook();
  put(wb, first, 3, { title: "Новая подпись существующего товара", videos: "https://youtu.be/M7lc1UVf-VE\nhttps://media.example.com/product.mp4", meatArticle: "0000123" });
  put(wb, first, 4, { id: "", slug: "", sortOrder: "", title: "Новый товар из Excel" });
  const plan = await engine.planProductImport(await file(wb), seed, 7, "replace");
  assert.deepEqual(plan.preview.issues, []);
  assert.equal(plan.preview.counts.create, 1); assert.equal(plan.preview.counts.update, 1); assert.equal(plan.preview.counts.archive, 0);
  const copy = structuredClone(seed); engine.applyProductImport(copy, plan); normalizeCmsContent(copy);
  const edited = copy.products.find(entity => entity.id === first.id);
  assert.equal(edited.slug, first.slug);
  assert.equal(edited.published.catalog.title, "Новая подпись существующего товара");
  assert.deepEqual(edited.published.detail.videos, ["https://www.youtube.com/watch?v=M7lc1UVf-VE", "https://media.example.com/product.mp4"]);
  assert.ok(edited.published.catalog.specs.some(spec => spec.label === "Артикул" && spec.value === "0000123"));
  assert.equal(copy.products.length, seed.products.length + 1);
  assert.deepEqual(copy.products.filter(entity => entity.id !== first.id).slice(0, -1), seed.products.filter(entity => entity.id !== first.id));
  assert.deepEqual(copy.news, seed.news);
});

test("full mode archives absent goods across every category and never deletes their data", async () => {
  const wb = await workbook(); put(wb, first);
  const plan = await engine.planProductImport(await file(wb), seed, 9, "full");
  assert.deepEqual(plan.preview.issues, []);
  assert.equal(plan.preview.counts.archive, seed.products.length - 1);
  const copy = structuredClone(seed); engine.applyProductImport(copy, plan); normalizeCmsContent(copy);
  assert.equal(copy.products.filter(entity => entity.status === "published").length, 1);
  for (const entity of copy.products.filter(entity => entity.id !== first.id)) assert.deepEqual(entity.published, seed.products.find(before => before.id === entity.id).published);
  assert.deepEqual(copy.news, seed.news);
});

test("bad fields, unknown and duplicated IDs, changed URL and formulas report the exact sheet and column", async () => {
  const wb = await workbook();
  put(wb, first, 3, { title: "", id: "unknown", slug: "other-url", videos: "https://example.com/page.html" });
  put(wb, first, 4, { description: { formula: 'WEBSERVICE("https://example.com")' } });
  put(wb, first, 5); put(wb, first, 6);
  const plan = await engine.planProductImport(await file(wb), seed, 3, "replace");
  assert.equal(plan.preview.canApply, false);
  assert.ok(plan.preview.issues.some(issue => issue.row === 3 && issue.column === "B" && issue.field === "Название"));
  assert.ok(plan.preview.issues.some(issue => issue.row === 3 && issue.column === "A" && /ID/.test(issue.message)));
  assert.ok(plan.preview.issues.some(issue => issue.row === 4 && issue.column === "D" && /Формулы/.test(issue.message)));
  assert.ok(plan.preview.issues.some(issue => issue.row === 6 && issue.column === "A" && /встречается/.test(issue.message)));
});

test("empty templates, renamed headers, missing categories and wrong versions cannot be applied", async () => {
  await assert.rejects(engine.planProductImport(template, seed, 1, "full"), /нет товаров/);
  const wb = await workbook(); put(wb, first);
  wb.getWorksheet("Мясо").getCell("B1").value = "Переименовано";
  wb.removeWorksheet(wb.getWorksheet("Птица").id);
  const plan = await engine.planProductImport(await file(wb), seed, 1, "full");
  assert.equal(plan.preview.canApply, false);
  assert.ok(plan.preview.issues.some(issue => issue.sheet === "Птица"));
  assert.ok(plan.preview.issues.some(issue => issue.sheet === "Мясо" && issue.column === "B" && issue.row === 1));
  wb.getWorksheet("Инструкция").getCell("B1").value = "future";
  await assert.rejects(engine.planProductImport(await file(wb), seed, 1, "replace"), /Версия шаблона/);
});

test("characteristic and list validation points to the actual input cell", async () => {
  const wb = await workbook();
  const cases = [
    ["meatGtin", "123"], ["meatUnitsPerPack", "-1"], ["meatVl", "101"],
    ["country", "Unknown country"], ["cooking", "Неизвестный способ"],
    ["cutIds", Array(51).fill("ribeye").join("\n")],
    ["tags", Array(51).fill("метка").join("\n")],
    ["cookingMethods", Array(51).fill("Жарка").join("\n")],
  ];
  cases.forEach(([key, value], index) => put(wb, first, index + 3, { id: "", slug: "", sortOrder: "", [key]: value }));
  const plan = await engine.planProductImport(await file(wb), seed, 1, "replace");
  const fields = config.productSpreadsheetFields("meat");
  cases.forEach(([key], index) => {
    const column = fields.findIndex(field => field.key === key);
    assert.ok(plan.preview.issues.some(issue => issue.row === index + 3 && issue.column === config.spreadsheetColumn(column) && issue.field === fields[column].label), key);
  });
  assert.equal(plan.preview.canApply, false);
});

test("all four categories accept their fields; optional blanks clear existing values and malformed media is rejected", async () => {
  const wb = await workbook();
  for (const category of ["bird", "beer"]) {
    const entity = seed.products.find(entity => entity.published.category === category);
    put(wb, entity, 3, { title: `Обновлённый ${category}` });
  }
  const water = { ...structuredClone(first), published: { ...structuredClone(first.published), category: "water", catalog: { ...structuredClone(first.published.catalog), meat: undefined, specs: [] } } };
  put(wb, water, 3, { id: "", slug: "", sortOrder: "", title: "Вода для теста", waterType: "Минеральная", waterGas: "Газированная", waterPackaging: "Стекло", catalogVolume: 500, catalogUnits: 12 });
  put(wb, first, 3, { videos: "https://example.com/page.html" });
  let plan = await engine.planProductImport(await file(wb), seed, 1, "replace");
  assert.ok(plan.preview.issues.some(issue => issue.field === "Видео" && issue.row === 3));
  set(wb, "meat", 3, "videos", "");
  plan = await engine.planProductImport(await file(wb), seed, 1, "replace");
  assert.deepEqual(plan.preview.issues, []);
  const copy = structuredClone(seed); engine.applyProductImport(copy, plan); normalizeCmsContent(copy);
  assert.ok(copy.products.some(entity => entity.published?.category === "water"));
  assert.equal(copy.products.find(entity => entity.id === first.id).published.detail.videos, undefined);
});

test("oversized, non-XLSX and malformed ZIP data fail without touching product data", async () => {
  const before = JSON.stringify(seed);
  for (const bytes of [Buffer.from("not xlsx"), Buffer.alloc(config.PRODUCT_IMPORT_MAX_BYTES + 1), template.subarray(0, 60)]) await assert.rejects(engine.planProductImport(bytes, seed, 1, "replace"));
  assert.equal(JSON.stringify(seed), before);
});

test("origin validation uses the public host behind a proxy and refuses external or missing origins", () => {
  assert.equal(isSameOriginRequest(new Request("http://localhost:3000/api/import", { headers: { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000" } })), true);
  assert.equal(isSameOriginRequest(new Request("http://internal/api/import", { headers: { "x-forwarded-host": "genlix.example", origin: "https://genlix.example" } })), true);
  for (const origin of ["https://evil.example", "null", "https://genlix.example/extra", "https://genlix.example@evil.example", "ftp://genlix.example"]) assert.equal(isSameOriginRequest(new Request("https://genlix.example/api/import", { headers: { origin } })), false);
  assert.equal(isSameOriginRequest(new Request("https://genlix.example/api/import")), false);
});

test("duplicate display order is a cell error; draft replacement is announced before applying", async () => {
  const content = structuredClone(seed), entity = content.products.find(entity => entity.id === first.id);
  entity.draft = structuredClone(entity.published); entity.draft.catalog.title = "Несохранённый черновик";
  const wb = await workbook(); put(wb, first, 3, { title: "Из Excel", sortOrder: seed.products.find(other => other.id !== first.id).sortOrder });
  let plan = await engine.planProductImport(await file(wb), content, 1, "replace");
  assert.ok(plan.preview.issues.some(issue => issue.field === "Порядок" && issue.row === 3));
  set(wb, "meat", 3, "sortOrder", "");
  plan = await engine.planProductImport(await file(wb), content, 1, "replace");
  assert.equal(plan.preview.draftCount, 1); assert.equal(plan.preview.canApply, true);
});

test("isolated CMS applies the whole import in one restorable revision and rejects a stale revision", async () => {
  const userFile = path.join(root, ".data/cms/current.json"), userBefore = await readFile(userFile, "utf8").catch(() => null);
  for (const key of ["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY"]) delete process.env[key];
  process.env.NODE_ENV = "development";
  const temp = await mkdtemp(path.join(tmpdir(), "genlix-excel-store-")), cwd = process.cwd();
  const wb = await workbook(); put(wb, first, 3, { title: "Импорт одной ревизией" }); const bytes = await file(wb);
  process.chdir(temp);
  try {
    const store = await jiti.import("../src/lib/cms/store.ts");
    const { snapshot } = await store.loadCmsSnapshot();
    const plan = await engine.planProductImport(bytes, snapshot.content, snapshot.revision, "full");
    assert.deepEqual(plan.preview.issues, []);
    const saved = await store.mutateCmsContent(snapshot.revision, "excel-test", "Bulk import", content => engine.applyProductImport(content, plan));
    assert.equal(saved.revision, snapshot.revision + 1);
    assert.deepEqual((await store.getCmsSnapshotByRevision(snapshot.revision)).content, snapshot.content);
    await assert.rejects(store.mutateCmsContent(snapshot.revision, "excel-test", "Stale import", content => engine.applyProductImport(content, plan)), /revision_conflict/);
    const restored = await store.commitCmsSnapshot(saved.revision, snapshot.content, "excel-test", "Restore before import");
    assert.deepEqual(restored.content, snapshot.content);
  } finally { process.chdir(cwd); }
  assert.equal(await readFile(userFile, "utf8").catch(() => null), userBefore);
});
