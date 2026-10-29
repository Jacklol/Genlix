import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import ExcelJS from "exceljs";
import { prepareSupplierImport } from "./lib/supplier-import.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const { createJiti } = createRequire(require.resolve("eslint/package.json"))("jiti");
const jiti = createJiti(import.meta.url, {alias:{"@":path.join(root,"src")}, fsCache:false});
const { buildProductPayloadFromForm } = await jiti.import("../src/lib/cms/forms.ts");
const { normalizeCmsContent } = await jiti.import("../src/lib/cms/types.ts");
const { buildLegacyCmsSeed } = await jiti.import("../src/lib/cms/seed.ts");
const spreadsheet = await jiti.import("../src/lib/cms/product-spreadsheet.ts");
const data = JSON.parse(await readFile(path.join(root,"assets/imports/primebeef-2026-10-29/catalog.json"),"utf8"));
const seed = buildLegacyCmsSeed();
const plan = prepareSupplierImport(seed, data, buildProductPayloadFromForm, "2026-10-29T12:00:00.000Z");
const complete = normalizeCmsContent({...seed, products:[...seed.products,...plan.additions]});
const bySku = sku => data.records.find(record => record.sku === sku);

test("all 173 source articles import once, preserving every existing product and news article", async () => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(path.join(root,"assets/imports/primebeef-2026-10-29/source.xlsx"));
  const articles = workbook.worksheets.slice(0,2).flatMap(sheet => {
    const result = [];
    sheet.eachRow(row => {if (/^\d{5,}$/.test(String(row.getCell(2).value))) result.push(String(row.getCell(2).value));});
    return result;
  });
  assert.equal(plan.additions.length,173);
  assert.equal(complete.products.length,197);
  assert.deepEqual(data.records.map(record=>record.sku).sort(),articles.sort());
  assert.equal(data.records.filter(record=>record.brand === "Primebeef").length,111);
  assert.equal(data.records.filter(record=>record.brand === "Праймфудс").length,62);
  assert.deepEqual(complete.products.slice(0,seed.products.length),seed.products);
  assert.deepEqual(complete.news,seed.news);
  assert.equal(new Set(complete.products.map(entity=>entity.slug)).size,197);
  for (const entity of plan.additions) {
    assert.equal(entity.published.catalog.image,"");
    assert.deepEqual(entity.published.detail.images,[]);
    assert.ok(entity.published.catalog.specs.some(spec=>spec.label === "Артикул"));
  }
});

test("43 exact articles retain annotations and cooking, while price columns never become descriptions", () => {
  assert.equal(data.records.filter(record=>record.source.annotation).length,43);
  assert.match(bySku("66222").form.description,/TENDERLOIN DEFATTED/);
  assert.match(bySku("66222").form.description,/Рекомендации по приготовлению:/);
  assert.match(bySku("66222").form.description,/деликатный вкус/);
  assert.doesNotMatch(bySku("62222").form.description,/TENDERLOIN DEFATTED/);
  assert.match(bySku("66815").form.description,/Категория качества — Top Choice/);
  assert.doesNotMatch(bySku("66815").form.description,/Грейдинг Prime/);
  assert.doesNotMatch(bySku("79925").form.description,/FLAP BONELESS/);
  assert.equal(bySku("66160").form.description.match(/Рекомендации по приготовлению:/g).length,1);
  assert.equal(bySku("65079").form.meatUnitWeight,"");
  assert.equal(bySku("65079").form.meatBoxWeight,"");
  assert.equal(bySku("66000").form.meatUnitsPerPack,"");
  for (const record of data.records) {
    assert.ok(record.form.description.length > 20);
    assert.ok(record.form.description.length <= 5000);
    assert.doesNotMatch(record.form.description,/\[object Object\]/);
    assert.equal(record.form.meatArticle,record.sku);
  }
});

test("repeated import preserves later edits, photos, drafts and archived products; duplicate articles fail", () => {
  const edited = structuredClone(complete);
  const entity = edited.products[seed.products.length];
  entity.published.catalog.image = "/assets/photo-added-later.png";
  entity.published.detail.images = [entity.published.catalog.image];
  entity.draft = structuredClone(entity.published);
  entity.draft.detail.description = "Описание, отредактированное менеджером";
  entity.status = "archived";
  const before = structuredClone(edited);
  const repeated = prepareSupplierImport(edited,data,buildProductPayloadFromForm);
  assert.equal(repeated.additions.length,0);
  assert.equal(repeated.skipped.length,173);
  assert.deepEqual(edited,before);
  assert.throws(()=>prepareSupplierImport(seed,{...data,records:[data.records[0],data.records[0]]},buildProductPayloadFromForm),/Duplicate incoming/);
  const collision = structuredClone(seed);
  collision.products[0].slug = plan.additions[0].slug;
  assert.throws(()=>prepareSupplierImport(collision,data,buildProductPayloadFromForm),/identity collision/);
});

test("the expanded catalog round-trips through the admin Excel contract, including complete annotations and empty photos", async () => {
  const bytes = await spreadsheet.exportProductSpreadsheet(complete.products);
  const roundTrip = await spreadsheet.planProductImport(bytes,complete,15,"replace");
  assert.deepEqual(roundTrip.preview.issues,[]);
  assert.equal(roundTrip.preview.counts.unchanged,197);
  assert.equal(roundTrip.preview.counts.create,0);
  const restored = structuredClone(complete);
  spreadsheet.applyProductImport(restored,roundTrip);
  assert.deepEqual(restored,complete);
});
