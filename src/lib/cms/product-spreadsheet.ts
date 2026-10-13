import ExcelJS from "exceljs";
import JSZip from "jszip";
import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { inflateRawSync } from "node:zlib";
import { createProductSlug } from "@/lib/catalog/product-slug";
import { meatCharacteristicFields } from "@/lib/catalog/meat-characteristics";
import { allCategoryFields } from "@/lib/catalog/category-fields";
import { buildProductPayloadFromForm, serializeSpecs } from "./forms";
import { CMS_SCHEMA_VERSION, normalizeCmsContent, type CmsContent, type CmsProductEntity, type CmsProductPayload } from "./types";
import {
  PRODUCT_DATA_START_ROW, PRODUCT_IMPORT_MAX_BYTES, PRODUCT_IMPORT_MAX_ROWS, PRODUCT_SHEET_CATEGORIES,
  PRODUCT_SHEET_NAMES, PRODUCT_SHEET_VERSION, meatSpreadsheetChoices, productSpreadsheetFields,
  spreadsheetColumn, type ProductImportMode, type ProductImportIssue, type ProductImportPreview, type ProductSpreadsheetField,
} from "./product-spreadsheet-fields";

export class ProductSpreadsheetError extends Error {}
const templatePath = path.join(process.cwd(), "assets/templates/genlix-products-v1.xlsx");
type ImportRow = { sheet: string; row: number; category: CmsProductPayload["category"]; values: Record<string, string> };
type PlannedRow = ImportRow & { id?: string; payload: CmsProductPayload; sortOrder?: number; unchanged: boolean };
export type ProductImportPlan = { preview: ProductImportPreview; rows: PlannedRow[]; archiveIds: string[] };

/** Bound both compressed and actual inflated data before handing a workbook to ExcelJS. */
function checkXlsxArchive(buffer: Buffer) {
  if (buffer.length > PRODUCT_IMPORT_MAX_BYTES) throw new ProductSpreadsheetError("Файл должен быть не больше 3 МБ.");
  if (buffer.length < 22 || buffer.readUInt32LE(0) !== 0x04034b50) throw new ProductSpreadsheetError("Нужен файл .xlsx, созданный из нашего шаблона.");
  let end = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65_557); i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50 && i + 22 + buffer.readUInt16LE(i + 20) === buffer.length) { end = i; break; }
  }
  if (end < 0 || buffer.readUInt16LE(end + 4) || buffer.readUInt16LE(end + 6)) throw new ProductSpreadsheetError("Не удалось прочитать Excel-файл.");
  const entries = buffer.readUInt16LE(end + 10);
  let offset = buffer.readUInt32LE(end + 16), total = 0;
  if (entries > 300 || offset >= end) throw new ProductSpreadsheetError("Структура файла слишком большая. Используйте наш шаблон.");
  const names = new Set<string>();
  for (let i = 0; i < entries; i++) {
    if (offset + 46 > end || buffer.readUInt32LE(offset) !== 0x02014b50) throw new ProductSpreadsheetError("Excel-файл повреждён.");
    const flags = buffer.readUInt16LE(offset + 8), method = buffer.readUInt16LE(offset + 10);
    const compressed = buffer.readUInt32LE(offset + 20), size = buffer.readUInt32LE(offset + 24);
    const nameSize = buffer.readUInt16LE(offset + 28), extraSize = buffer.readUInt16LE(offset + 30), commentSize = buffer.readUInt16LE(offset + 32);
    const local = buffer.readUInt32LE(offset + 42);
    const name = buffer.subarray(offset + 46, offset + 46 + nameSize).toString("utf8");
    if (flags & 1 || ![0, 8].includes(method) || size > 16 * 1024 * 1024 || names.has(name) || /(?:^|\/)\.\.(?:\/|$)|vbaProject|\.bin$/i.test(name)) throw new ProductSpreadsheetError("Используйте обычный .xlsx без пароля и макросов.");
    names.add(name);
    if (local + 30 > offset || buffer.readUInt32LE(local) !== 0x04034b50) throw new ProductSpreadsheetError("Excel-файл повреждён.");
    const start = local + 30 + buffer.readUInt16LE(local + 26) + buffer.readUInt16LE(local + 28);
    if (start + compressed > offset) throw new ProductSpreadsheetError("Excel-файл повреждён.");
    const raw = buffer.subarray(start, start + compressed);
    const data = method === 8 ? inflateRawSync(raw, { maxOutputLength: 16 * 1024 * 1024 }) : raw;
    total += data.length;
    if (data.length !== size || total > 32 * 1024 * 1024) throw new ProductSpreadsheetError("В файле слишком много данных. Максимум 2000 товаров.");
    if (/\.xml$/.test(name)) {
      const xml = data.toString("utf8");
      if (/<!DOCTYPE/i.test(xml)) throw new ProductSpreadsheetError("Структура Excel-файла не поддерживается.");
      if (/^xl\/worksheets\/sheet\d+\.xml$/.test(name)) {
        for (const cell of xml.matchAll(/<(?:\w+:)?c\b[^>]*\br="([A-Z]+)(\d+)"/g)) {
          if (Number(cell[2]) > 10_000 || cell[1].length > 2) throw new ProductSpreadsheetError("В файле слишком много строк или колонок. Используйте наш шаблон.");
        }
      }
    }
    offset += 46 + nameSize + extraSize + commentSize;
  }
  if (offset !== end || !names.has("xl/workbook.xml")) throw new ProductSpreadsheetError("Excel-файл повреждён.");
}

function cellText(cell: ExcelJS.Cell): string {
  const value = cell.value;
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "object" && "hyperlink" in value) return value.hyperlink.trim();
  if (typeof value === "object" && "richText" in value) return value.richText.map(part => part.text).join("").trim();
  throw new ProductSpreadsheetError("Введите текст или число. Формулы, даты и ошибки Excel не поддерживаются.");
}

// ExcelJS expects unprefixed SpreadsheetML tags. XLSX exporters may legally
// use a namespace prefix, so normalize that namespace without changing data.
export async function readProductSpreadsheetWorkbook(buffer: Buffer) {
  const zip = await JSZip.loadAsync(buffer);
  let changed = false;
  for (const entry of Object.values(zip.files).filter(entry => entry.name.startsWith("xl/") && entry.name.endsWith(".xml"))) {
    const source = await entry.async("string");
    let xml = source;
    const namespace = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
    for (const match of source.matchAll(/xmlns:([A-Za-z][\w.-]*)=["']http:\/\/schemas\.openxmlformats\.org\/spreadsheetml\/2006\/main["']/g)) {
      const prefix = match[1].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      xml = xml.replace(new RegExp(`<(/?)${prefix}:`, "g"), "<$1");
      xml = xml.replace(match[0], `xmlns="${namespace}"`);
    }
    if (xml !== source) { zip.file(entry.name, xml); changed = true; }
  }
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load((changed ? await zip.generateAsync({ type: "nodebuffer" }) : buffer) as unknown as ExcelJS.Buffer);
  return workbook;
}

function issue(sheet: string, row: number, index: number, field: ProductSpreadsheetField, message: string): ProductImportIssue {
  return { sheet, row, column: spreadsheetColumn(index), field: field.label, message };
}

function formErrorField(fields: ProductSpreadsheetField[], message: string) {
  const aliases: Record<string, RegExp> = {
    image: /Основное изображение/, images: /Галерея/, videos: /^Видео/,
    specs: /[Хх]арактеристик/, meatGtin: /^GTIN-13/, meatUnitsPerPack: /^Количество в упаковке/,
    meatVl: /^VL /, country: /^Код страны/, cooking: /^(Неизвестный способ|Способы приготовления)/,
    cutIds: /^Отрубы:/, tags: /^Метки:/, cookingMethods: /^Текстовые способы приготовления:/,
    brand: /«Производитель»/, detailCategory: /«Название категории»/, productType: /«Тип продукта»/,
  };
  return fields.findIndex(field => message.includes(`«${field.label}»`) || message.includes(`«${field.key}»`) || aliases[field.key]?.test(message));
}

async function readRows(buffer: Buffer) {
  try { checkXlsxArchive(buffer); } catch (error) {
    if (error instanceof ProductSpreadsheetError) throw error;
    throw new ProductSpreadsheetError("Не удалось распаковать Excel-файл. Сохраните его ещё раз как .xlsx.");
  }
  let workbook: ExcelJS.Workbook;
  try { workbook = await readProductSpreadsheetWorkbook(buffer); } catch { throw new ProductSpreadsheetError("Не удалось прочитать .xlsx. Используйте наш шаблон."); }
  if (workbook.getWorksheet("Инструкция")?.getCell("B1").value !== PRODUCT_SHEET_VERSION) throw new ProductSpreadsheetError("Версия шаблона не поддерживается. Скачайте актуальный шаблон.");
  const allowed = new Set(["Инструкция", "Примеры", "Справочники", ...Object.values(PRODUCT_SHEET_NAMES)]);
  if (workbook.worksheets.some(sheet => !allowed.has(sheet.name))) throw new ProductSpreadsheetError("Не меняйте названия листов и не добавляйте новые. Используйте наш шаблон.");
  const issues: ProductImportIssue[] = [], rows: ImportRow[] = [];
  for (const category of PRODUCT_SHEET_CATEGORIES) {
    const name = PRODUCT_SHEET_NAMES[category], fields = productSpreadsheetFields(category);
    const sheet = workbook.getWorksheet(name);
    if (!sheet) { issues.push(issue(name, 1, 0, fields[0], `Отсутствует лист «${name}».`)); continue; }
    let headersValid = true;
    fields.forEach((field, index) => {
      if (sheet.getRow(1).getCell(index + 1).value !== field.label) { headersValid = false; issues.push(issue(name, 1, index, field, `Заголовок должен быть «${field.label}».`)); }
    });
    if (sheet.actualColumnCount > fields.length) { headersValid = false; issues.push({ sheet: name, row: 1, column: spreadsheetColumn(fields.length), field: "Заголовок", message: "В листе есть лишние колонки. Скачайте актуальный шаблон." }); }
    if (!headersValid) continue;
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber < PRODUCT_DATA_START_ROW || !row.hasValues) return;
      const values: Record<string, string> = {};
      let valid = true, populated = false;
      fields.forEach((field, index) => {
        try { values[field.key] = cellText(row.getCell(index + 1)); populated ||= Boolean(values[field.key]); }
        catch (error) { valid = false; issues.push(issue(name, rowNumber, index, field, (error as Error).message)); }
      });
      if (valid && populated) rows.push({ sheet: name, row: rowNumber, category, values });
    });
  }
  if (rows.length > PRODUCT_IMPORT_MAX_ROWS) throw new ProductSpreadsheetError("Допускается не более 2000 товаров в одном файле.");
  if (!rows.length && !issues.length) throw new ProductSpreadsheetError("В файле нет товаров. Заполняйте листы категорий начиная с третьей строки. Лист «Примеры» не импортируется.");
  return { rows, issues };
}

export function productSpreadsheetValues(entity: CmsProductEntity, payload = entity.published ?? entity.draft): Record<string, string | number> {
  if (!payload) throw new ProductSpreadsheetError("У товара нет данных.");
  const { catalog, detail, category } = payload;
  const managed = new Set(category === "meat" ? meatCharacteristicFields.map(field => field.label) : allCategoryFields.map(field => field.label));
  const values: Record<string, string | number> = {
    id: entity.id, slug: entity.slug, sortOrder: entity.sortOrder, title: catalog.title, brand: catalog.brand,
    description: detail.description, image: catalog.image, images: detail.images.filter(image => image !== catalog.image).join("\n"),
    videos: detail.videos?.join("\n") ?? "", detailCategory: detail.category, packagingDisplay: detail.packaging,
    shelfLife: detail.shelfLife, storage: detail.storage, cookingMethods: detail.cookingMethods.join("\n"),
    specs: serializeSpecs(catalog.specs.filter(spec => !managed.has(spec.label))), tags: catalog.tags?.join("\n") ?? "",
    badge: catalog.badge ?? "", buttonLabel: catalog.buttonLabel ?? detail.buttonLabel ?? "", buttonHref: detail.buttonHref ?? "",
    recommendation: catalog.recommendation ?? "", beerRecommendationLabel: detail.beerRecommendationLabel ?? "",
  };
  if (category === "meat" && catalog.meat) {
    for (const key of ["species", "country", "channel", "productType", "packaging"] as const) values[key] = meatSpreadsheetChoices[key].find(choice => choice.value === catalog.meat![key])?.label ?? catalog.meat[key];
    values.cooking = catalog.meat.cooking.map(code => meatSpreadsheetChoices.cooking.find(choice => choice.value === code)?.label ?? code).join("\n");
    values.cutIds = catalog.meat.cutIds.join("\n");
    for (const field of meatCharacteristicFields) values[field.name] = catalog.specs.find(spec => spec.label === field.label)?.value ?? "";
  } else {
    for (const field of productSpreadsheetFields(category)) {
      if (!(field.key in values)) {
        const source = catalog.specs.find(spec => spec.label === field.label)?.value ?? "";
        const numeric = Number(source.replace(",", ".").replace(/%$/, ""));
        values[field.key] = source && field.numeric && Number.isFinite(numeric) ? numeric : source;
      }
    }
  }
  return values;
}

function comparableRow(row: Record<string, string | number>, fields: ProductSpreadsheetField[]) {
  return fields.map(field => String(row[field.key] ?? "").trim());
}

export async function planProductImport(buffer: Buffer, content: CmsContent, revision: number, mode: ProductImportMode): Promise<ProductImportPlan> {
  const { rows, issues } = await readRows(buffer);
  const existing = new Map(content.products.map(entity => [entity.id, entity]));
  const seen = new Set<string>(), planned: PlannedRow[] = [];
  const changes: ProductImportPreview["changes"] = [];
  const counts = { create: 0, update: 0, publish: 0, unchanged: 0, archive: 0 };
  let draftCount = 0;
  for (const row of rows) {
    const fields = productSpreadsheetFields(row.category), entity = row.values.id ? existing.get(row.values.id) : undefined;
    const before = entity?.published ?? entity?.draft;
    const original = entity ? productSpreadsheetValues(entity, before) : undefined;
    const beforeIssues = issues.length;
    const form = new FormData(); form.set("category", row.category);
    for (const [index, field] of fields.entries()) {
      const source = row.values[field.key];
      if (field.required && !source) issues.push(issue(row.sheet, row.row, index, field, "Обязательное поле не заполнено."));
      if (field.maxLength && source.length > field.maxLength) issues.push(issue(row.sheet, row.row, index, field, `Максимум ${field.maxLength} символов.`));
      const choice = field.choices?.find(choice => choice.label === source || choice.value === source);
      if (source && field.choices && !choice && source !== String(original?.[field.key] ?? "") && field.key !== "country") issues.push(issue(row.sheet, row.row, index, field, "Выберите значение из выпадающего списка."));
      form.set(field.key, choice?.value ?? source);
    }
    if (row.values.id) {
      if (!entity) issues.push(issue(row.sheet, row.row, 0, fields[0], "ID не найден. Для нового товара очистите ID и адрес страницы."));
      if (seen.has(row.values.id)) issues.push(issue(row.sheet, row.row, 0, fields[0], "Этот ID уже встречается в файле."));
      seen.add(row.values.id);
    }
    const slugIndex = fields.findIndex(field => field.key === "slug");
    if (row.values.slug && (!entity || row.values.slug !== entity.slug)) issues.push(issue(row.sheet, row.row, slugIndex, fields[slugIndex], entity ? "Адрес существующего товара нельзя менять." : "Для нового товара оставьте адрес пустым. Он создастся автоматически."));
    const sortIndex = fields.findIndex(field => field.key === "sortOrder");
    if (row.values.sortOrder && !/^\d{1,9}$/.test(row.values.sortOrder)) issues.push(issue(row.sheet, row.row, sortIndex, fields[sortIndex], "Укажите целое число от 0 до 999999999."));
    if (row.category === "meat") {
      const cooked = row.values.cooking.split(/[\n,]+/).map(value => value.trim()).filter(Boolean).map(value => meatSpreadsheetChoices.cooking.find(choice => choice.label === value || choice.value === value)?.value ?? value);
      form.set("cooking", cooked.join(","));
    }
    if (issues.length !== beforeIssues) continue;
    try {
      const exact = entity && entity.status === "published" && before && before.category === row.category && JSON.stringify(comparableRow(row.values, fields)) === JSON.stringify(comparableRow(original!, fields));
      const payload = exact ? structuredClone(before) : buildProductPayloadFromForm(form, before);
      const unchanged = Boolean(entity?.status === "published" && entity.published && JSON.stringify(payload) === JSON.stringify(entity.published) && (!row.values.sortOrder || Number(row.values.sortOrder) === entity.sortOrder));
      planned.push({ ...row, id: entity?.id, payload, sortOrder: row.values.sortOrder ? Number(row.values.sortOrder) : entity?.sortOrder, unchanged });
      const kind = unchanged ? "unchanged" : entity ? entity.status === "draft" || entity.status === "archived" ? "publish" : "update" : "create";
      counts[kind]++;
      if (entity?.draft && !unchanged) draftCount++;
      changes.push({ kind, title: payload.catalog.title, category: PRODUCT_SHEET_NAMES[row.category], id: entity?.id, slug: entity?.slug, sheet: row.sheet, row: row.row });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось прочитать товар.";
      const index = formErrorField(fields, message);
      issues.push(issue(row.sheet, row.row, Math.max(index, 0), fields[Math.max(index, 0)], message));
    }
  }
  const archiveIds = mode === "full" ? content.products.filter(entity => entity.status !== "archived" && !seen.has(entity.id)).map(entity => entity.id) : [];
  const rowIds = new Set(planned.map(row => row.id).filter(Boolean));
  const orders = new Map(content.products.filter(entity => !rowIds.has(entity.id)).map(entity => [entity.sortOrder, entity.published?.catalog.title ?? entity.draft?.catalog.title ?? entity.id]));
  let nextOrder = content.products.reduce((max, entity) => Math.max(max, entity.sortOrder), -1) + 1;
  for (const row of planned) {
    const order = row.sortOrder ?? nextOrder++;
    if (orders.has(order)) {
      const fields = productSpreadsheetFields(row.category), index = fields.findIndex(field => field.key === "sortOrder");
      issues.push(issue(row.sheet, row.row, index, fields[index], `Порядок ${order} уже используется товаром «${orders.get(order)}». Укажите другое число или оставьте ячейку пустой.`));
    }
    orders.set(order, row.payload.catalog.title);
  }
  for (const id of archiveIds) {
    const entity = existing.get(id)!, payload = entity.published ?? entity.draft!;
    counts.archive++;
    changes.push({ kind: "archive", id, slug: entity.slug, title: payload.catalog.title, category: PRODUCT_SHEET_NAMES[payload.category] });
  }
  if (content.products.length + counts.create > PRODUCT_IMPORT_MAX_ROWS) issues.push({ sheet: "Файл", row: 0, column: "", field: "Количество товаров", message: "После импорта будет больше 2000 товаров, включая архив и черновики." });
  if (!issues.length) {
    try {
      const proposed = structuredClone(content);
      applyProductImport(proposed, { rows: planned, archiveIds });
      normalizeCmsContent(proposed);
    } catch { issues.push({ sheet: "Файл", row: 0, column: "", field: "Каталог", message: "Данные не прошли итоговую проверку каталога. Проверьте заполнение файла." }); }
  }
  const fingerprint = createHash("sha256").update(buffer).update(`:${revision}:${mode}`).digest("hex");
  return { rows: planned, archiveIds, preview: { revision, fingerprint, mode, issues: issues.slice(0, 200), issueCount: issues.length, changes, counts, draftCount, canApply: !issues.length && planned.length > 0 } };
}

/** Called once inside the CMS revision transaction; rows and archival are committed together. */
export function applyProductImport(content: CmsContent, plan: Pick<ProductImportPlan, "rows" | "archiveIds">) {
  const now = new Date().toISOString();
  let nextOrder = content.products.reduce((max, entity) => Math.max(max, entity.sortOrder), -1) + 1;
  for (const row of plan.rows) {
    const entity = row.id ? content.products.find(entity => entity.id === row.id) : undefined;
    if (row.unchanged) continue;
    if (entity) {
      entity.published = structuredClone(row.payload); delete entity.draft; entity.status = "published";
      entity.updatedAt = now; entity.sortOrder = row.sortOrder ?? entity.sortOrder;
    } else {
      let id = randomUUID(), slug = createProductSlug(row.payload.catalog.title, id);
      while (content.products.some(entity => entity.id === id || entity.slug === slug)) { id = randomUUID(); slug = createProductSlug(row.payload.catalog.title, id); }
      content.products.push({ id, slug, status: "published", published: structuredClone(row.payload), createdAt: now, updatedAt: now, sortOrder: row.sortOrder ?? nextOrder++ });
    }
  }
  for (const id of plan.archiveIds) {
    const entity = content.products.find(entity => entity.id === id);
    if (entity) { entity.status = "archived"; entity.updatedAt = now; }
  }
  content.schemaVersion = CMS_SCHEMA_VERSION;
}

export async function exportProductSpreadsheet(products?: CmsProductEntity[]) {
  const template = await readFile(templatePath);
  if (!products) return template;
  const workbook = await readProductSpreadsheetWorkbook(template);
  for (const category of PRODUCT_SHEET_CATEGORIES) {
    const sheet = workbook.getWorksheet(PRODUCT_SHEET_NAMES[category])!, fields = productSpreadsheetFields(category);
    const list = products.filter(entity => entity.status === "published" && entity.published?.category === category).sort((a, b) => a.sortOrder - b.sortOrder);
    list.forEach((entity, index) => {
      const row = sheet.getRow(index + PRODUCT_DATA_START_ROW), values = productSpreadsheetValues(entity);
      fields.forEach((field, column) => { row.getCell(column + 1).value = values[field.key] ?? ""; });
      row.height = 72;
    });
  }
  return Buffer.from(await workbook.xlsx.writeBuffer());
}
