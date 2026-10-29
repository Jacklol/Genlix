import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prepareSupplierImport } from "./lib/supplier-import.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);
if (process.argv.slice(2).some(arg => arg !== "--apply")) throw new Error("Usage: node scripts/import-primebeef.mjs [--apply]");
const require = createRequire(import.meta.url);
const { createJiti } = createRequire(require.resolve("eslint/package.json"))("jiti");
const jiti = createJiti(import.meta.url, {alias:{"@":path.join(root,"src")}, fsCache:false});
const store = await jiti.import("../src/lib/cms/store.ts");
const { buildProductPayloadFromForm } = await jiti.import("../src/lib/cms/forms.ts");
const { normalizeCmsContent } = await jiti.import("../src/lib/cms/types.ts");
if (store.getCmsBackendMode() !== "local") throw new Error("This command only imports into the local CMS. Use the admin import for the published site.");

const directory = path.join(root,"assets/imports/primebeef-2026-10-29");
const data = JSON.parse(await readFile(path.join(directory,"catalog.json"),"utf8"));
const source = await readFile(path.join(directory,"source.xlsx"));
if (createHash("sha256").update(source).digest("hex") !== data.sourceSha256) throw new Error("Supplier source checksum mismatch");
const loaded = await store.loadCmsSnapshot();
if (!loaded.writable || loaded.mode !== "local") throw new Error("Local CMS is not writable");
const plan = prepareSupplierImport(loaded.snapshot.content, data, buildProductPayloadFromForm);
normalizeCmsContent({...loaded.snapshot.content,products:[...loaded.snapshot.content.products,...plan.additions]});
console.log(JSON.stringify({mode:process.argv.includes("--apply")?"apply":"preview",revision:loaded.snapshot.revision,create:plan.additions.length,alreadyPresent:plan.skipped.length,annotations:data.records.filter(record=>record.source.annotation).length,existingProducts:loaded.snapshot.content.products.length,sourceWarnings:data.warnings.length},null,2));
if (process.argv.includes("--apply") && plan.additions.length) {
  const saved = await store.mutateCmsContent(loaded.snapshot.revision,"supplier-import","Импорт Праймбиф и Праймфудс из Excel от 29.10.2026",content => {content.products.push(...plan.additions);});
  console.log(`Saved local CMS revision ${saved.revision}: ${saved.content.products.length} products.`);
}
