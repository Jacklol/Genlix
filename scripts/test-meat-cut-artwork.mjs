import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const require = createRequire(import.meta.url);
const { createJiti } = createRequire(require.resolve("eslint/package.json"))("jiti");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jiti = createJiti(import.meta.url, { alias: { "@": path.join(root, "src") }, fsCache: false });
const { meatCutRegions } = await jiti.import("../src/lib/meat-cuts.ts");
const { meatCatalogArtworkRegions, findCatalogMeatCut } = await jiti.import("../src/lib/catalog/meat-catalog-artwork.ts");
const { parseMeatCatalogFilters, getAllMeatItems } = await jiti.import("../src/lib/catalog/index.ts");

test("all 14 diagram zones survive filter URL parsing, including newly selectable cuts", () => {
  assert.equal(meatCatalogArtworkRegions.length, 14);
  assert.equal(new Set(meatCatalogArtworkRegions.map(region => region.id)).size, 14);
  for (const region of meatCatalogArtworkRegions) {
    assert.equal(parseMeatCatalogFilters({ cutId: region.id }).cutId, region.id);
    assert.equal(findCatalogMeatCut(region.id).titleRu, region.titleRu);
  }
  assert.equal(parseMeatCatalogFilters({ cutId: "unknown-cut" }).cutId, undefined);
});

test("existing cut IDs and older round links remain valid", () => {
  for (const region of meatCutRegions) {
    assert.equal(parseMeatCatalogFilters({ cutId: region.id }).cutId, region.id);
  }
  assert.equal(findCatalogMeatCut("myakot-bedra").titleRu, "Мякоть бедра");
  assert.equal(meatCatalogArtworkRegions.filter(region => region.legacyCutIds?.includes("myakot-bedra")).length, 3);
});

test("rib and striploin assignments stay intact, and the tenderloin appears under tenderloin", () => {
  const rib = getAllMeatItems({ species: "beef", cutId: "tolstyj-kraj" });
  assert.equal(rib.length, 5);
  assert.ok(rib.every(product => product.meat.cutIds.includes("tolstyj-kraj")));
  assert.equal(getAllMeatItems({ species: "beef", cutId: "tonkij-kraj" }).length, 2);
  assert.deepEqual(getAllMeatItems({ species: "beef", cutId: "vyrezka" }).map(product => product.slug), ["file-minon-tenderloin"]);
});
