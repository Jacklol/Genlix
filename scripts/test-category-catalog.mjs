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
const { categoryFields, categoryDetailSpecs, fieldValue, unmanagedCategorySpecs } = await jiti.import("../src/lib/catalog/category-fields.ts");
const engine = await jiti.import("../src/lib/catalog/filter-engine.ts");
const { buildProductPayloadFromForm, serializeSpecs } = await jiti.import("../src/lib/cms/forms.ts");
const { normalizeCmsContent, CMS_SCHEMA_VERSION } = await jiti.import("../src/lib/cms/types.ts");
const { buildLegacyCmsSeed } = await jiti.import("../src/lib/cms/seed.ts");
const seed = buildLegacyCmsSeed();

function payloadFor(category) {
  const original = structuredClone(seed.products.find((p) => p.published.category === (category === "water" ? "beer" : category)).published);
  if (category === "water") { original.category = "water"; original.catalog.specs = []; }
  return original;
}
function formFor(payload, managed = true) {
  const { catalog, detail } = payload;
  const form = new FormData();
  for (const [key, value] of Object.entries({
    category: payload.category, title: catalog.title, brand: catalog.brand, image: catalog.image,
    description: detail.description, images: detail.images.join("\n"),
    specs: serializeSpecs(managed ? unmanagedCategorySpecs(catalog.specs) : catalog.specs),
    detailCategory: detail.category, packagingDisplay: detail.packaging, shelfLife: detail.shelfLife, storage: detail.storage,
  })) form.set(key, value);
  if (managed) for (const field of categoryFields[payload.category]) form.set(field.name, fieldValue(catalog.specs, field));
  return form;
}
const examples = {
  catalogCountry: "Россия", catalogChannel: "HoReCa / ритейл", catalogVolume: "500", catalogUnits: "12", catalogArticle: "CATALOG-TEST",
  birdSpecies: "Курица", birdPart: "Крылья", birdCondition: "Охлаждённое", birdPackaging: "Вакуум", birdUnitWeight: "0,8–1,2", birdBoxWeight: "10",
  beerStyle: "IPA", beerAlcohol: "Алкогольное", beerPackaging: "Банка", beerAbv: "5.5%", beerIbu: "35",
  waterType: "Минеральная", waterGas: "Негазированная", waterPackaging: "Стекло", waterMineralization: "0,2–0,5",
};
function filled(category) {
  const original = payloadFor(category), form = formFor(original);
  for (const field of categoryFields[category]) form.set(field.name, examples[field.name]);
  return JSON.parse(JSON.stringify(buildProductPayloadFromForm(form, original)));
}
function item(category, payload = filled(category), slug = category) {
  return { ...payload.catalog, slug, filterValues: engine.productFilterValues(category, payload.catalog.brand, payload.catalog.specs) };
}

for (const category of ["bird", "beer", "water"]) {
  test(`${category}: optional fields, round-trip, explicit clearing, old-form preservation`, () => {
    const payload = filled(category);
    assert.deepEqual(buildProductPayloadFromForm(formFor(payload), payload).catalog.specs, payload.catalog.specs);
    assert.equal(categoryDetailSpecs(category, payload.catalog.specs).length, categoryFields[category].length);
    const legacy = formFor(payload, false); legacy.set("specs", "Наша характеристика | Сохранить");
    const fromOldForm = buildProductPayloadFromForm(legacy, payload);
    for (const field of categoryFields[category]) assert.equal(fieldValue(fromOldForm.catalog.specs, field), examples[field.name]);
    const empty = formFor(payload);
    for (const field of categoryFields[category]) empty.set(field.name, "");
    const cleared = buildProductPayloadFromForm(empty, payload);
    assert.deepEqual(categoryDetailSpecs(category, cleared.catalog.specs), []);
    assert.deepEqual(cleared.detail.images, payload.detail.images);
    assert.equal(cleared.detail.storage, payload.detail.storage);
    const snapshot = structuredClone(seed); snapshot.products[0].draft = payload;
    assert.deepEqual(normalizeCmsContent(JSON.parse(JSON.stringify(snapshot))).products[0].draft, payload);
  });
}
test("existing beer strength/IBU and bird specifications remain unchanged", () => {
  for (const p of seed.products.filter((p) => ["beer", "bird"].includes(p.published.category))) {
    assert.deepEqual(buildProductPayloadFromForm(formFor(p.published), p.published).catalog.specs, p.published.catalog.specs);
  }
});
test("numeric fields validate, normalize commas and reject invalid units/percentages", () => {
  const payload = payloadFor("beer"), form = formFor(payload);
  form.set("beerAbv", "5,7"); form.set("catalogVolume", "1000");
  assert.equal(fieldValue(buildProductPayloadFromForm(form, payload).catalog.specs, categoryFields.beer.find((f) => f.name === "beerAbv")), "5.7%");
  for (const [key, value] of [["beerAbv", "101"], ["beerIbu", "-2"], ["catalogVolume", "0"], ["catalogUnits", "1.5"], ["beerStyle", "injected"]]) {
    const invalid = formFor(payload); invalid.set(key, value);
    assert.throws(() => buildProductPayloadFromForm(invalid, payload));
  }
});
test("legacy poultry metadata and unknown products are not guessed or lost", () => {
  const old = payloadFor("bird");
  const unknown = item("bird", old, "unknown");
  assert.deepEqual(unknown.filterValues, { manufacturer: old.catalog.brand });
  const known = item("bird");
  assert.equal(engine.filterCategoryProducts([known, unknown], {}).length, 2);
  assert.equal(engine.filterCategoryProducts([known, unknown], { birdSpecies: "Курица" }).length, 1);
  const meat = seed.products.find((p) => p.published.catalog.meat?.species === "poultry").published;
  const values = engine.productFilterValues("bird", meat.catalog.brand, meat.catalog.specs, meat.catalog.meat);
  assert.equal(values.country, meat.catalog.meat.country);
  assert.equal(values.birdSpecies, undefined);
});
test("filters combine with AND, both channels match, URL round-trips and chips can remove one key", () => {
  const products = [item("beer")];
  const filters = { manufacturer: products[0].brand, country: "russia", channel: "retail", packaging: "Банка", style: "IPA" };
  assert.equal(engine.filterCategoryProducts(products, filters).length, 1);
  assert.equal(engine.filterCategoryProducts(products, { ...filters, channel: "horeca" }).length, 1);
  assert.equal(engine.filterCategoryProducts(products, { ...filters, packaging: "Кег" }).length, 0);
  assert.deepEqual(engine.availableFilterOptions(products, "channel").map((x) => x.value).sort(), ["horeca", "retail"]);
  const href = engine.catalogHref("/catalog/beer", filters);
  const parsed = engine.parseCategoryFilters("beer", Object.fromEntries(new URL(href, "http://localhost").searchParams), products);
  assert.deepEqual(parsed, filters);
  delete parsed.style;
  assert.equal(engine.filterCategoryProducts(products, parsed).length, 1);
  assert.deepEqual(engine.parseCategoryFilters("beer", { price: "100", style: "missing", volume: ["500", "1000"] }, products), { volume: "500" });
});
test("category transitions carry only compatible common filters; return URLs cannot escape catalog", () => {
  const products = [item("water")];
  const available = Object.fromEntries(engine.commonFilterKeys.map((key) => [key, engine.availableFilterOptions(products, key)]));
  assert.deepEqual(engine.compatibleCommonFilters({ manufacturer: "Missing", country: "russia", channel: "horeca", style: "IPA", cutId: "rib" }, available), { country: "russia", channel: "horeca" });
  const target = "/catalog/water?country=russia&volume=500";
  assert.equal(engine.safeCatalogReturn(new URL(engine.productHref("test", target), "http://localhost").searchParams.get("returnTo")), target);
  for (const unsafe of ["//evil.test", "/catalog/water/../../genlix-admin", "javascript:alert(1)", "/genlix-admin", "/catalog/water\\evil", [target]]) assert.equal(engine.safeCatalogReturn(unsafe), undefined);
});
test("v1/v2 remain readable; new water/both-channel payloads require v3", () => {
  for (const version of [1, 2]) {
    const snapshot = structuredClone(seed); snapshot.schemaVersion = version;
    assert.equal(normalizeCmsContent(snapshot).schemaVersion, version);
    snapshot.products[0].draft = filled("water");
    assert.throws(() => normalizeCmsContent(snapshot), /version 3/);
    delete snapshot.products[0].draft;
    snapshot.products.find((p) => p.published.catalog.meat).published.catalog.meat.channel = "both";
    assert.throws(() => normalizeCmsContent(snapshot), /version 3/);
    snapshot.schemaVersion = CMS_SCHEMA_VERSION;
    assert.equal(normalizeCmsContent(snapshot).schemaVersion, 3);
  }
});
test("no price field/filter exists and blank placeholders produce no detail rows", () => {
  for (const category of ["bird", "beer", "water"]) {
    assert.ok(!JSON.stringify(categoryFields[category]).match(/price|цен[аы]/i));
    assert.deepEqual(categoryDetailSpecs(category, categoryFields[category].map((f) => ({ label: f.label, value: "—" }))), []);
  }
});
test("isolated store: drafts are private, publish/reload/archival/history/restore work, user data stays untouched", async () => {
  const userBefore = await readFile(path.join(root, ".data/cms/current.json"), "utf8").catch(() => null);
  for (const key of ["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY"]) delete process.env[key];
  process.env.NODE_ENV = "development";
  const testDir = await mkdtemp(path.join(tmpdir(), "genlix-category-store-"));
  const before = process.cwd(); process.chdir(testDir);
  try {
    const store = await jiti.import("../src/lib/cms/store.ts");
    const repo = await jiti.import("../src/lib/cms/repository.ts");
    const initial = await store.loadCmsSnapshot();
    const original = structuredClone(initial.snapshot.content);
    const payload = filled("water"); payload.catalog.brand = payload.detail.brand = "QA water";
    const id = "test:water", slug = "qa-water-test";
    const draft = await store.mutateCmsContent(initial.snapshot.revision, "test", "Create water draft", (content) => {
      content.schemaVersion = 3;
      content.products.push({ id, slug, status: "draft", draft: payload, sortOrder: 200, createdAt: "2026-09-09T10:00:00.000Z", updatedAt: "2026-09-09T10:00:00.000Z" });
    });
    assert.equal((await repo.getPublishedCategoryItems("water")).length, 0);
    assert.deepEqual((await repo.getCatalogCommonOptions()).water.manufacturer, []);
    const published = await store.mutateCmsContent(draft.revision, "test", "Publish water", (content) => {
      const entity = content.products.find((p) => p.id === id); entity.published = entity.draft; delete entity.draft; entity.status = "published";
    });
    assert.equal((await repo.getPublishedCategoryItems("water")).length, 1);
    const detail = await repo.getPublishedProductBySlug(slug);
    assert.ok(detail.additionalSpecs.some((s) => s.label === "Вид воды" && s.value === "Минеральная"));
    assert.deepEqual(detail.cookingMethods, []);
    assert.deepEqual((await store.loadCmsSnapshot()).snapshot.content.products.find((p) => p.id === id).published, payload);
    const bird = await repo.getPublishedCategoryItems("bird");
    assert.equal(bird.length, original.products.filter((p) => p.published.category === "bird" || p.published.catalog.meat?.species === "poultry").length);
    assert.equal(new Set(bird.map((p) => p.slug)).size, bird.length);
    const edited = await store.mutateCmsContent(published.revision, "test", "New draft", (content) => {
      const entity = content.products.find((p) => p.id === id); entity.draft = structuredClone(entity.published); entity.draft.catalog.brand = entity.draft.detail.brand = "Private draft";
    });
    assert.equal((await repo.getPublishedCategoryItems("water"))[0].brand, "QA water");
    await assert.rejects(store.mutateCmsContent(published.revision, "test", "Stale save", () => {}), /revision_conflict/);
    const archived = await store.mutateCmsContent(edited.revision, "test", "Archive", (content) => { content.products.find((p) => p.id === id).status = "archived"; });
    assert.equal((await repo.getPublishedCategoryItems("water")).length, 0);
    const history = await store.getCmsSnapshotByRevision(published.revision);
    const restored = await store.commitCmsSnapshot(archived.revision, history.content, "test", "Restore");
    assert.equal((await repo.getPublishedCategoryItems("water")).length, 1);
    assert.deepEqual(restored.content.products.filter((p) => p.id !== id), original.products);
    assert.ok((await store.listCmsHistory()).length >= 6);
  } finally { process.chdir(before); }
  assert.equal(await readFile(path.join(root, ".data/cms/current.json"), "utf8").catch(() => null), userBefore);
});
