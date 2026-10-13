import { categoryFields, categoryLabels, countryLabels } from "@/lib/catalog/category-fields";
import { meatCharacteristicFields } from "@/lib/catalog/meat-characteristics";
import type { CmsProductCategory } from "./types";

export const PRODUCT_SHEET_VERSION = "GENLIX_PRODUCTS_V1";
export const PRODUCT_IMPORT_MAX_BYTES = 3 * 1024 * 1024;
export const PRODUCT_IMPORT_MAX_ROWS = 2_000;
export const PRODUCT_DATA_START_ROW = 3;
export const PRODUCT_SHEET_CATEGORIES: CmsProductCategory[] = ["meat", "bird", "beer", "water"];
export const PRODUCT_SHEET_NAMES = categoryLabels;

export type ProductImportMode = "replace" | "full";
export type ProductSpreadsheetField = {
  key: string;
  label: string;
  description: string;
  required?: boolean;
  choices?: { value: string; label: string }[];
  numeric?: "integer" | "decimal" | "percent";
  maxLength?: number;
  width?: number;
};
const choices = (items: Record<string, string>) => Object.entries(items).map(([value, label]) => ({ value, label }));
export const meatSpreadsheetChoices: Record<string, { value: string; label: string }[]> = {
  species: choices({ beef: "Говядина", lamb: "Баранина", pork: "Свинина", poultry: "Птица" }),
  channel: choices({ horeca: "HoReCa", retail: "Ритейл", both: "HoReCa и ритейл" }),
  productType: choices({ steak: "Стейк", "large-cut": "Крупный отруб", "minced-meat": "Фарш", goulash: "Гуляш", fillet: "Филе", cutlets: "Котлеты" }),
  packaging: choices({ "large-block": "Крупный блок", "fixed-weight-vacuum": "Вакуум, фиксированный вес", "tray-or-box": "Лоток / короб" }),
  country: choices(countryLabels),
  cooking: choices({ grill: "Гриль", fry: "Жарка", braise: "Тушение", bake: "Запекание", boil: "Варка" }),
};

const common: ProductSpreadsheetField[] = [
  { key: "id", label: "ID товара", description: "Для обновления сохраните ID из выгрузки. Для нового товара оставьте пустым.", width: 30 },
  { key: "title", label: "Название", description: "Полное название товара. До 220 символов.", required: true, maxLength: 220, width: 36 },
  { key: "brand", label: "Производитель / бренд", description: "Название производителя или бренда. До 120 символов.", required: true, maxLength: 120, width: 25 },
  { key: "description", label: "Описание", description: "Описание для страницы товара. До 5000 символов.", required: true, maxLength: 5_000, width: 48 },
  { key: "image", label: "Главное фото", description: "Прямая HTTPS-ссылка с разрешённого медиахоста или путь /assets/… из выгрузки.", required: true, maxLength: 2_000, width: 45 },
  { key: "images", label: "Дополнительные фото", description: "До 49 ссылок. Каждая с новой строки в ячейке (Alt+Enter). Главное фото уже указано отдельно.", width: 45 },
  { key: "videos", label: "Видео", description: "YouTube или прямые HTTPS-ссылки MP4/WebM, каждая с новой строки. До 50 роликов. Файлы до 50 МБ, большие — через YouTube.", width: 45 },
  { key: "detailCategory", label: "Категория на странице", description: "Подпись категории в карточке, например «Мраморная говядина». До 160 символов.", required: true, maxLength: 160, width: 28 },
  { key: "packagingDisplay", label: "Фасовка", description: "Понятное описание фасовки. До 300 символов.", required: true, maxLength: 300, width: 30 },
  { key: "shelfLife", label: "Срок годности", description: "Например, «15 суток в вакууме». До 300 символов.", required: true, maxLength: 300, width: 28 },
  { key: "storage", label: "Условия хранения", description: "Например, «От 0 до +4 °C». До 500 символов.", required: true, maxLength: 500, width: 32 },
];
const extra: ProductSpreadsheetField[] = [
  { key: "cookingMethods", label: "Приготовление на странице", description: "Названия способов приготовления через запятую или с новой строки, например «Гриль, Жарка».", width: 30 },
  { key: "specs", label: "Прочие характеристики", description: "Каждая с новой строки: Название | Значение. Поля из отдельных колонок сюда не дублируйте.", width: 44 },
  { key: "tags", label: "Метки", description: "Метки товара через запятую или с новой строки.", width: 24 },
  { key: "badge", label: "Бейдж", description: "Выберите из списка или оставьте пустым.", choices: choices({ "хит": "хит", new: "new", "витрина": "витрина", "ферма": "ферма" }), width: 20 },
  { key: "buttonLabel", label: "Текст кнопки", description: "Пусто: «Запросить поставку». До 180 символов.", maxLength: 180, width: 30 },
  { key: "buttonHref", label: "Ссылка кнопки", description: "Внутренний путь или HTTPS-ссылка. Пусто: /#contacts.", maxLength: 300, width: 36 },
  { key: "recommendation", label: "Рекомендация в каталоге", description: "Существующий текст рекомендации. Можно оставить пустым.", maxLength: 2_000, width: 32 },
  { key: "beerRecommendationLabel", label: "Рекомендация пива", description: "Существующая подпись рекомендации пива. Можно оставить пустым.", maxLength: 120, width: 30 },
  { key: "sortOrder", label: "Порядок", description: "Целое число от 0. Для существующего товара пусто сохраняет порядок, для нового задаётся автоматически.", numeric: "integer", width: 18 },
  { key: "slug", label: "Адрес страницы", description: "Для существующего товара сохраните из выгрузки. Для нового оставьте пустым: адрес создастся автоматически.", width: 40 },
];

export function productSpreadsheetFields(category: CmsProductCategory): ProductSpreadsheetField[] {
  const specific: ProductSpreadsheetField[] = category === "meat" ? [
    ...[ ["species", "Вид мяса"], ["country", "Страна"], ["channel", "Формат поставки"], ["productType", "Тип товара"], ["packaging", "Тип упаковки"] ].map(([key, label]) => ({ key, label, required: true, description: "Выберите значение из списка.", choices: meatSpreadsheetChoices[key], width: 28 })),
    { key: "cooking", label: "Приготовление для фильтра", description: "Гриль, Жарка, Тушение, Запекание, Варка. Несколько названий через запятую или с новой строки.", width: 32 },
    { key: "cutIds", label: "Коды отрубов", description: "Коды отрубов из текущей выгрузки. Через запятую или с новой строки.", width: 28 },
    ...meatCharacteristicFields.map((field) => ({ key: field.name, label: field.label, description: `${field.placeholder ?? "Характеристика товара. Если неизвестна, оставьте пустым."}${field.name === "meatGtin" ? " Вводите как текст, сохраняя ведущие нули." : ""}`, maxLength: field.maxLength, choices: field.options?.map(value => ({ value, label: value })), width: 28 })),
  ] : categoryFields[category].map((field) => ({ key: field.name, label: field.label, description: field.options ? "Выберите из списка или оставьте пустым." : field.placeholder ? `Например, ${field.placeholder}. Можно оставить пустым.` : "Если значение неизвестно, оставьте пустым.", choices: field.options?.map(value => ({ value, label: value })), numeric: field.numeric, maxLength: 160, width: 28 }));
  return [...common, ...specific, ...extra];
}

export function spreadsheetColumn(index: number) {
  let value = index + 1, result = "";
  while (value > 0) { result = String.fromCharCode(65 + (value - 1) % 26) + result; value = Math.floor((value - 1) / 26); }
  return result;
}

export type ProductImportIssue = { sheet: string; row: number; column: string; field: string; message: string };
export type ProductImportChange = { kind: "create" | "update" | "publish" | "unchanged" | "archive"; title: string; category: string; id?: string; sheet?: string; row?: number; slug?: string };
export type ProductImportPreview = {
  revision: number;
  fingerprint: string;
  mode: ProductImportMode;
  issues: ProductImportIssue[];
  issueCount: number;
  changes: ProductImportChange[];
  counts: Record<ProductImportChange["kind"], number>;
  draftCount: number;
  canApply: boolean;
};
