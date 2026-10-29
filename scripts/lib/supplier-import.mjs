import { createHash } from "node:crypto";

function productKey(brand, sku) {
  return `${brand.trim().toLocaleLowerCase("ru")}:${sku.trim()}`;
}

export function prepareSupplierImport(content, data, buildPayload, now = new Date().toISOString()) {
  if (data.version !== 1 || !Array.isArray(data.records) || !data.records.length) {
    throw new Error("Invalid supplier import package");
  }
  const existing = new Map();
  for (const entity of content.products) {
    for (const payload of [entity.published, entity.draft].filter(Boolean)) {
      const sku = payload.catalog.specs.find(spec => spec.label === "Артикул")?.value;
      if (!sku) continue;
      const key = productKey(payload.catalog.brand, sku);
      if (existing.has(key) && existing.get(key) !== entity.id) throw new Error(`Duplicate existing article: ${key}`);
      existing.set(key, entity.id);
    }
  }

  const incoming = new Set(), additions = [], skipped = [];
  let sortOrder = content.products.reduce((max, entity) => Math.max(max, entity.sortOrder + 1), 0);
  for (const record of data.records) {
    const key = productKey(record.brand, record.sku);
    if (incoming.has(key)) throw new Error(`Duplicate incoming article: ${key}`);
    incoming.add(key);
    if (record.form.brand !== record.brand || record.form.meatArticle !== record.sku) {
      throw new Error(`Article does not match its payload: ${key}`);
    }
    // Repeated runs leave existing products, media, drafts and publication status intact.
    if (existing.has(key)) { skipped.push(key); continue; }
    const form = new FormData();
    for (const [name, value] of Object.entries(record.form)) form.set(name, String(value));
    const published = buildPayload(form, undefined);
    const hex = createHash("sha256").update(`genlix:supplier:${key}`).digest("hex");
    const id = `${hex.slice(0,8)}-${hex.slice(8,12)}-5${hex.slice(13,16)}-a${hex.slice(17,20)}-${hex.slice(20,32)}`;
    const slug = `${record.brand === "Primebeef" ? "primebeef" : "primefoods"}-${record.sku}`;
    if (content.products.some(entity => entity.id === id || entity.slug === slug)) {
      throw new Error(`Product identity collision: ${key}`);
    }
    additions.push({id, slug, status:"published", published, createdAt:now, updatedAt:now, sortOrder:sortOrder++});
  }
  return {additions, skipped};
}
