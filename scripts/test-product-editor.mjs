import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const require = createRequire(import.meta.url);
const eslintRequire = createRequire(require.resolve("eslint/package.json"));
const { createJiti } = eslintRequire("jiti");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jiti = createJiti(import.meta.url, { alias: { "@": path.join(root, "src") }, fsCache: false });
const { createProductSlug } = await jiti.import("../src/lib/catalog/product-slug.ts");
const { initialProductImages, moveProductImage } = await jiti.import("../src/lib/cms/product-editor.ts");
const { buildProductPayloadFromForm } = await jiti.import("../src/lib/cms/forms.ts");
const { buildLegacyCmsSeed } = await jiti.import("../src/lib/cms/seed.ts");
const { normalizeCmsContent } = await jiti.import("../src/lib/cms/types.ts");
const { SHOW_PRODUCT_PAIRINGS } = await jiti.import("../src/lib/catalog/features.ts");
const seed = buildLegacyCmsSeed();
const original = seed.products[0].published;

function formWithImages(urls) {
  const form = new FormData();
  const values = {
    category: "meat", title: original.catalog.title, brand: original.catalog.brand,
    image: urls[0] ?? "", images: urls.slice(1).join("\n"),
    specs: original.catalog.specs.map((spec) => `${spec.label} | ${spec.value}`).join("\n"),
    detailCategory: original.detail.category, description: original.detail.description,
    packagingDisplay: original.detail.packaging, shelfLife: original.detail.shelfLife,
    storage: original.detail.storage, cookingMethods: original.detail.cookingMethods.join(","),
    ...original.catalog.meat,
    cutIds: original.catalog.meat.cutIds.join(","), cooking: original.catalog.meat.cooking.join(","),
  };
  for (const [key, value] of Object.entries(values)) form.set(key, String(value));
  return form;
}

test("slug transliterates Russian title and appends part of the product ID", () => {
  assert.equal(createProductSlug("Говяжий фарш домашний", "abc123de-4567-489a-abcd-0123456789ab"), "govyazhiy-farsh-domashniy-abc123de4567");
});
test("identical titles get distinct IDs and valid bounded URLs", () => {
  const urls = new Set(Array.from({ length: 1000 }, () => createProductSlug("Рибай / Top Choice", randomUUID())));
  assert.equal(urls.size, 1000);
  for (const url of urls) assert.match(url, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.ok(createProductSlug("Длинное название ".repeat(100), randomUUID()).length <= 120);
});
test("slug handles accents, Belarusian, whitespace and punctuation", () => {
  assert.match(createProductSlug(" Café — Індычка / ялавічына! ", randomUUID()), /^cafe-indychka-yalavichyna-/);
  assert.match(createProductSlug("🍖", randomUUID()), /^tovar-/);
  assert.throws(() => createProductSlug("Рибай", "invalid-id"));
});
test("initial gallery is unique and keeps the existing main photo first", () => {
  assert.deepEqual(initialProductImages("/main.png", ["/side.png", "/main.png", "/side.png"]), ["/main.png", "/side.png"]);
});
test("reordering and main photo selection are immutable and persist into both payloads", () => {
  const urls = ["/main.png", "/side.png", "/other.png"];
  const reordered = moveProductImage(urls, 2, 0);
  assert.deepEqual(urls, ["/main.png", "/side.png", "/other.png"]);
  assert.deepEqual(reordered, ["/other.png", "/main.png", "/side.png"]);
  const payload = buildProductPayloadFromForm(formWithImages(reordered), original);
  assert.equal(payload.catalog.image, reordered[0]);
  assert.deepEqual(payload.detail.images, reordered);
  assert.deepEqual(moveProductImage(urls, -1, 0), urls);
  assert.deepEqual(moveProductImage(urls, 0, 10), urls);
});
test("removing one photo does not remove any other image", () => {
  const remaining = original.detail.images.slice(1);
  const payload = buildProductPayloadFromForm(formWithImages(remaining), original);
  assert.deepEqual(payload.detail.images, remaining);
  assert.equal(payload.catalog.image, remaining[0]);
});
test("image URLs with commas round-trip intact and blob/unsafe URLs are refused", () => {
  const urls = ["/assets/main.png", "/uploads/photo,second.png"];
  assert.deepEqual(buildProductPayloadFromForm(formWithImages(urls), original).detail.images, urls);
  for (const invalid of ["blob:local-preview", "javascript:alert(1)", "https://untrusted.example/image.jpg"]) {
    assert.throws(() => buildProductPayloadFromForm(formWithImages([invalid]), original));
  }
});
test("hidden recommendations survive edits and snapshot export/import", () => {
  assert.equal(SHOW_PRODUCT_PAIRINGS, false);
  const payload = buildProductPayloadFromForm(formWithImages(original.detail.images), original);
  assert.equal(payload.catalog.recommendation, original.catalog.recommendation);
  assert.equal(payload.detail.beerRecommendationLabel, original.detail.beerRecommendationLabel);
  const copy = structuredClone(seed);
  copy.products[0].draft = payload;
  const restored = normalizeCmsContent(JSON.parse(JSON.stringify(copy)));
  assert.equal(restored.products[0].draft.catalog.recommendation, original.catalog.recommendation);
  assert.equal(restored.products[0].published.catalog.recommendation, original.catalog.recommendation);
});
