import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

// Reuse the TypeScript loader already installed with ESLint; no app dependency
// or database access is needed. Run: node scripts/test-meat-characteristics.mjs
const require = createRequire(import.meta.url);
const eslintRequire = createRequire(require.resolve("eslint/package.json"));
const { createJiti } = eslintRequire("jiti");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jiti = createJiti(import.meta.url, { alias: { "@": path.join(root, "src") }, fsCache: false });
const {
  meatCharacteristicFields,
  getMeatCharacteristicValue,
  getMeatDetailSpecs,
  getMeatCatalogSpecs,
  getUnmanagedMeatSpecs,
} = await jiti.import("../src/lib/catalog/meat-characteristics.ts");
const { buildProductPayloadFromForm, serializeSpecs } = await jiti.import("../src/lib/cms/forms.ts");
const { buildLegacyCmsSeed } = await jiti.import("../src/lib/cms/seed.ts");
const { normalizeCmsContent } = await jiti.import("../src/lib/cms/types.ts");
const { getCmsChecksum } = await jiti.import("../src/lib/cms/store.ts");

const seed = buildLegacyCmsSeed();
const original = seed.products.find((product) => product.published.category === "meat").published;

function formFor(payload = original, withNewFields = true) {
  const { catalog, detail } = payload;
  const form = new FormData();
  const values = {
    category: payload.category,
    title: catalog.title,
    brand: catalog.brand,
    image: catalog.image,
    specs: serializeSpecs(payload.category === "meat" && withNewFields
      ? getUnmanagedMeatSpecs(catalog.specs) : catalog.specs),
    images: detail.images.join("\n"),
    detailCategory: detail.category,
    description: detail.description,
    packagingDisplay: detail.packaging,
    shelfLife: detail.shelfLife,
    storage: detail.storage,
    cookingMethods: detail.cookingMethods.join(", "),
    tags: catalog.tags?.join(", ") ?? "",
    recommendation: catalog.recommendation ?? "",
    badge: catalog.badge ?? "",
    buttonLabel: catalog.buttonLabel ?? detail.buttonLabel ?? "",
    buttonHref: detail.buttonHref ?? "/#contacts",
    beerRecommendationLabel: detail.beerRecommendationLabel ?? "",
    ...catalog.meat,
    cooking: catalog.meat?.cooking.join(", ") ?? "",
    cutIds: catalog.meat?.cutIds.join(", ") ?? "",
  };
  for (const [key, value] of Object.entries(values)) form.set(key, String(value));
  if (withNewFields) {
    for (const field of meatCharacteristicFields) {
      form.set(field.name, getMeatCharacteristicValue(catalog.specs, field.name));
    }
  }
  return form;
}

const examples = {
  meatCondition: "Охлаждённое / замороженное",
  meatGrade: "Тестовый сорт",
  meatMarbling: "5",
  meatUnitWeight: "0,8–1,2",
  meatBoxWeight: "15",
  meatUnitsPerPack: "10",
  meatArticle: "TEST-ONLY-001",
  meatGtin: "0000000000000",
  meatVl: "98,5",
};
const expectedCatalogSpecs = [...original.catalog.specs, { label: "Мраморность", value: examples.meatMarbling }];

function populatedPayload() {
  const form = formFor();
  for (const [name, value] of Object.entries(examples)) form.set(name, value);
  return buildProductPayloadFromForm(form, original);
}

test("all new fields may be empty and do not create blank rows", () => {
  const form = formFor();
  for (const field of meatCharacteristicFields) form.set(field.name, "   ");
  const result = buildProductPayloadFromForm(form, original);
  assert.deepEqual(getMeatDetailSpecs(result.catalog.specs), []);
  assert.deepEqual(getUnmanagedMeatSpecs(result.catalog.specs), getUnmanagedMeatSpecs(original.catalog.specs));
  assert.equal(result.detail.packaging, original.detail.packaging);
  assert.equal(result.detail.shelfLife, original.detail.shelfLife);
  assert.equal(result.detail.storage, original.detail.storage);
  assert.deepEqual(result.detail.images, original.detail.images);
});

test("each field round-trips through the same snapshot schema and editor", () => {
  const result = populatedPayload();
  const snapshot = structuredClone(seed);
  snapshot.products[0].published = result;
  const normalized = normalizeCmsContent(JSON.parse(JSON.stringify(snapshot)));
  assert.equal(normalized.schemaVersion, seed.schemaVersion);
  const restored = normalized.products[0].published;
  for (const [name, value] of Object.entries(examples)) {
    assert.equal(getMeatCharacteristicValue(restored.catalog.specs, name), value);
  }
  const resaved = buildProductPayloadFromForm(formFor(restored), restored);
  assert.deepEqual(resaved.catalog.specs, restored.catalog.specs);
  assert.equal(getMeatDetailSpecs(resaved.catalog.specs).length, meatCharacteristicFields.length);
  assert.deepEqual(getMeatCatalogSpecs(resaved.catalog.specs), expectedCatalogSpecs);
});

test("untouched existing characteristic order stays identical on every meat product", () => {
  for (const { published } of seed.products.filter((product) => product.published.category === "meat")) {
    const result = buildProductPayloadFromForm(formFor(published), published);
    assert.deepEqual(result.catalog.specs, published.catalog.specs);
  }
});

test("old forms preserve new characteristics without duplicating them", () => {
  const payload = populatedPayload();
  const form = formFor(payload, false);
  // Older clients might only have the original catalog characteristics.
  form.set("specs", serializeSpecs(original.catalog.specs));
  const result = buildProductPayloadFromForm(form, payload);
  for (const [name, value] of Object.entries(examples)) {
    assert.equal(getMeatCharacteristicValue(result.catalog.specs, name), value);
  }
  assert.equal(new Set(result.catalog.specs.map((spec) => spec.label)).size, result.catalog.specs.length);
});

test("clearing one field removes only that field", () => {
  const payload = populatedPayload();
  const form = formFor(payload);
  form.set("meatBoxWeight", "");
  const result = buildProductPayloadFromForm(form, payload);
  assert.equal(getMeatCharacteristicValue(result.catalog.specs, "meatBoxWeight"), "");
  assert.equal(getMeatCharacteristicValue(result.catalog.specs, "meatArticle"), examples.meatArticle);
  assert.deepEqual(getMeatCatalogSpecs(result.catalog.specs), expectedCatalogSpecs);
});

test("empty and placeholder values never reach the detail rows", () => {
  assert.deepEqual(getMeatDetailSpecs([
    { label: "Вес коробки, кг", value: " " },
    { label: "Артикул", value: "—" },
  ]), []);
});

test("unrelated catalog characteristics are retained", () => {
  const form = formFor();
  form.set("specs", `${form.get("specs")}\nОсобенность производителя | Проверочное значение`);
  const result = buildProductPayloadFromForm(form, original);
  assert.ok(result.catalog.specs.some((spec) => spec.label === "Особенность производителя"));
});

for (const [name, value] of [
  ["meatGtin", "123"], ["meatGtin", "123456789012x"],
  ["meatUnitsPerPack", "-2"], ["meatUnitsPerPack", "1.5"],
  ["meatVl", "101"], ["meatVl", "-1"], ["meatVl", "many"],
  ["meatGrade", "x".repeat(121)], ["meatCondition", "unknown"],
]) {
  test(`rejects invalid ${name}: ${value.slice(0, 20)}`, () => {
    const form = formFor();
    form.set(name, value);
    assert.throws(() => buildProductPayloadFromForm(form, original));
  });
}

test("non-meat products do not pick up meat inputs", () => {
  for (const { published } of seed.products.filter((product) => product.published.category !== "meat")) {
    const form = formFor(published);
    form.set("meatBoxWeight", "15");
    const result = buildProductPayloadFromForm(form, published);
    assert.deepEqual(result.catalog.specs, published.catalog.specs);
  }
});

test("changing the catalog category does not discard the saved characteristics", () => {
  const payload = populatedPayload();
  const form = formFor(payload);
  form.set("category", "bird");
  const moved = buildProductPayloadFromForm(form, payload);
  const backForm = formFor(moved);
  backForm.set("category", "meat");
  for (const [key, value] of Object.entries(original.catalog.meat)) {
    backForm.set(key, Array.isArray(value) ? value.join(", ") : value);
  }
  const restored = buildProductPayloadFromForm(backForm, moved);
  for (const [name, value] of Object.entries(examples)) {
    assert.equal(getMeatCharacteristicValue(restored.catalog.specs, name), value);
  }
});

test("existing backups normalize byte-for-byte without changing checksum", () => {
  const snapshot = JSON.parse(JSON.stringify(seed));
  const before = getCmsChecksum(snapshot);
  assert.deepEqual(normalizeCmsContent(snapshot), snapshot);
  assert.equal(getCmsChecksum(normalizeCmsContent(snapshot)), before);
});

const localSnapshot = path.join(root, ".data/cms/current.json");
test("current local snapshot still passes checksum validation (read-only)", {
  skip: !existsSync(localSnapshot),
}, () => {
  const snapshot = JSON.parse(readFileSync(localSnapshot, "utf8"));
  assert.equal(getCmsChecksum(snapshot.content), snapshot.checksum);
});
