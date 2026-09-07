import type { ProductBadge } from "@/components/ProductCard";
import type {
  CatalogProduct,
  MeatCookingMethod,
  MeatPackaging,
  MeatProductType,
  MeatSalesChannel,
  MeatSpecies,
  ProductDetailData,
  ProductSpec,
} from "@/lib/catalog/types";
import type { NewsCategory } from "@/lib/news";
import type { TextContentBlock } from "@/lib/text-content";

import type {
  CmsNewsEntity,
  CmsNewsPayload,
  CmsProductCategory,
  CmsProductEntity,
  CmsProductPayload,
} from "./types";
import { normalizeCmsImageUrl, normalizeCmsLink } from "./types";

const productCategories = new Set<CmsProductCategory>(["meat", "beer", "bird"]);
const badges = new Set<ProductBadge>(["хит", "new", "витрина", "ферма"]);
const channels = new Set<MeatSalesChannel>(["horeca", "retail"]);
const species = new Set<MeatSpecies>(["beef", "lamb", "pork", "poultry"]);
const productTypes = new Set<MeatProductType>([
  "steak",
  "large-cut",
  "minced-meat",
  "goulash",
  "fillet",
  "cutlets",
]);
const packagingTypes = new Set<MeatPackaging>([
  "large-block",
  "fixed-weight-vacuum",
  "tray-or-box",
]);
const cookingMethods = new Set<MeatCookingMethod>([
  "grill",
  "fry",
  "braise",
  "bake",
  "boil",
]);
const newsCategories = new Set<NewsCategory>(["cases", "supplies", "cooking", "farms"]);

export class CmsFormError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CmsFormError";
  }
}

function safeImageUrl(source: string, label: string) {
  try {
    return normalizeCmsImageUrl(source, label);
  } catch {
    throw new CmsFormError(
      `Поле «${label}»: используйте локальный путь или разрешённый HTTPS-адрес изображения`,
    );
  }
}

function safeLink(source: string, label: string) {
  try {
    return normalizeCmsLink(source, label);
  } catch {
    throw new CmsFormError(`Поле «${label}»: используйте внутренний путь или HTTPS-ссылку`);
  }
}

function value(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function required(formData: FormData, name: string, label: string, maxLength = 500) {
  const result = value(formData, name);

  if (!result) {
    throw new CmsFormError(`Заполните поле «${label}»`);
  }

  if (result.length > maxLength) {
    throw new CmsFormError(`Поле «${label}» слишком длинное`);
  }

  return result;
}

function optional(formData: FormData, name: string, maxLength = 2000) {
  const result = value(formData, name);

  if (result.length > maxLength) {
    throw new CmsFormError(`Поле «${name}» слишком длинное`);
  }

  return result || undefined;
}

function enumValue<TValue extends string>(
  formData: FormData,
  name: string,
  label: string,
  allowed: Set<TValue>,
) {
  const result = required(formData, name, label, 80) as TValue;

  if (!allowed.has(result)) {
    throw new CmsFormError(`Недопустимое значение поля «${label}»`);
  }

  return result;
}

export function parseCmsSlug(formData: FormData) {
  const slug = required(formData, "slug", "Адрес страницы", 120).toLowerCase();

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new CmsFormError(
      "Адрес страницы может содержать только латинские буквы, цифры и дефисы",
    );
  }

  return slug;
}

export function parseRevision(formData: FormData) {
  const source = formData.get("revision");

  if (typeof source !== "string" || !/^(0|[1-9]\d*)$/.test(source)) {
    throw new CmsFormError("Версия данных устарела. Обновите страницу.");
  }

  const revision = Number(source);

  if (!Number.isSafeInteger(revision) || revision < 0) {
    throw new CmsFormError("Версия данных устарела. Обновите страницу.");
  }

  return revision;
}

function splitList(source: string, label = "Список", maxItems = 100) {
  const items = source
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (items.length > maxItems) {
    throw new CmsFormError(`${label}: допускается не более ${maxItems} значений`);
  }

  if (items.some((item) => item.length > 2_000)) {
    throw new CmsFormError(`${label}: одно из значений слишком длинное`);
  }

  return items;
}

export function parseSpecs(source: string): ProductSpec[] {
  const specs = source
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separatorIndex = line.includes("|") ? line.indexOf("|") : line.indexOf(":");

      if (separatorIndex <= 0 || separatorIndex === line.length - 1) {
        throw new CmsFormError(
          "Характеристики указываются по одной на строку: Название | Значение",
        );
      }

      const label = line.slice(0, separatorIndex).trim();
      const specValue = line.slice(separatorIndex + 1).trim();

      if (label.length > 160 || specValue.length > 500) {
        throw new CmsFormError("Название или значение характеристики слишком длинное");
      }

      return { label, value: specValue };
    });

  if (specs.length > 100) {
    throw new CmsFormError("Допускается не более 100 характеристик товара");
  }

  return specs;
}

export function serializeSpecs(specs: ProductSpec[]) {
  return specs.map((spec) => `${spec.label} | ${spec.value}`).join("\n");
}

function defaultBreadcrumbs(category: CmsProductCategory, title: string) {
  const categoryConfig = {
    beer: { href: "/catalog/beer", label: "Пиво" },
    bird: { href: "/catalog/bird", label: "Птица" },
    meat: { href: "/catalog/meat", label: "Мясо" },
  }[category];

  return [
    { label: "Главная", href: "/" },
    { label: "Каталог", href: "/#catalog" },
    categoryConfig,
    { label: title },
  ];
}

export function buildProductPayloadFromForm(
  formData: FormData,
  existing: CmsProductPayload | undefined,
  uploadedImage?: string,
): CmsProductPayload {
  const category = enumValue(formData, "category", "Раздел", productCategories);
  const title = required(formData, "title", "Название", 220);
  const brand = required(formData, "brand", "Производитель", 120);
  const image = safeImageUrl(
    uploadedImage ?? required(formData, "image", "Основное изображение", 2000),
    "Основное изображение",
  );
  const specs = parseSpecs(value(formData, "specs"));
  const tags = splitList(value(formData, "tags"), "Метки", 50);
  const recommendation = optional(formData, "recommendation");
  const buttonLabel = optional(formData, "buttonLabel", 180);
  const badgeSource = value(formData, "badge") as ProductBadge;
  const badge = badgeSource && badges.has(badgeSource) ? badgeSource : undefined;
  const catalog: Omit<CatalogProduct, "slug"> = {
    brand,
    image,
    specs,
    title,
    ...(badge ? { badge } : {}),
    ...(buttonLabel ? { buttonLabel } : {}),
    ...(recommendation ? { recommendation } : {}),
    ...(tags.length ? { tags } : {}),
  };

  if (category === "meat") {
    const channel = enumValue(formData, "channel", "Формат поставки", channels);
    const meatSpecies = enumValue(formData, "species", "Вид мяса", species);
    const country = required(formData, "country", "Страна", 40).toLowerCase();
    const productType = enumValue(formData, "productType", "Тип продукта", productTypes);
    const packaging = enumValue(formData, "packaging", "Тип упаковки", packagingTypes);
    const cutIds = splitList(value(formData, "cutIds"), "Отрубы", 50);
    const cooking = splitList(value(formData, "cooking"), "Способы приготовления", 20).map((method) => {
      if (!cookingMethods.has(method as MeatCookingMethod)) {
        throw new CmsFormError(`Неизвестный способ приготовления: ${method}`);
      }
      return method as MeatCookingMethod;
    });

    if (!/^[a-z0-9-]{2,40}$/.test(country)) {
      throw new CmsFormError("Код страны указывается латиницей, например russia или belarus");
    }

    catalog.meat = {
      channel,
      cooking,
      country,
      cutIds,
      packaging,
      productType,
      species: meatSpecies,
    };
  }

  const gallery = splitList(value(formData, "images"), "Галерея", 50).map(
    (galleryImage, index) => safeImageUrl(galleryImage, `Галерея, изображение ${index + 1}`),
  );
  const images = Array.from(new Set([image, ...gallery]));
  const buttonHref = safeLink(
    optional(formData, "buttonHref", 300) ?? "/#contacts",
    "Ссылка кнопки",
  );
  const detail: Omit<ProductDetailData, "slug"> = {
    beerRecommendationLabel: optional(formData, "beerRecommendationLabel", 120),
    brand,
    breadcrumbs: existing?.category === category && existing.detail.breadcrumbs?.length
      ? [
          ...existing.detail.breadcrumbs.slice(0, -1),
          { label: title },
        ]
      : defaultBreadcrumbs(category, title),
    buttonHref,
    buttonLabel: buttonLabel ?? "Запросить поставку",
    category: required(formData, "detailCategory", "Название категории", 160),
    cookingMethods: splitList(
      value(formData, "cookingMethods"),
      "Текстовые способы приготовления",
      50,
    ),
    description: required(formData, "description", "Описание", 5000),
    images,
    packaging: required(formData, "packagingDisplay", "Фасовка", 300),
    shelfLife: required(formData, "shelfLife", "Срок годности", 300),
    storage: required(formData, "storage", "Условия хранения", 500),
    title,
  };

  return { catalog, category, detail };
}

export function getEditableProductPayload(entity?: CmsProductEntity) {
  return entity?.draft ?? entity?.published;
}

export function serializeTextBlocks(blocks: TextContentBlock[]) {
  return blocks
    .map((block) => {
      if (block.type === "heading") {
        return `## ${block.text}`;
      }

      if (block.type === "list") {
        return block.items.map((item) => `- ${item}`).join("\n");
      }

      return block.text;
    })
    .join("\n\n");
}

export function parseTextBlocks(source: string): TextContentBlock[] {
  const chunks = source
    .replaceAll("\r\n", "\n")
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  if (!chunks.length) {
    throw new CmsFormError("Добавьте текст новости");
  }

  return chunks.map((chunk) => {
    if (chunk.startsWith("## ")) {
      return { type: "heading", text: chunk.slice(3).trim() };
    }

    const lines = chunk.split("\n").map((line) => line.trim());
    if (lines.every((line) => line.startsWith("- "))) {
      return { type: "list", items: lines.map((line) => line.slice(2).trim()) };
    }

    return { type: "paragraph", text: lines.join(" ") };
  });
}

export function buildNewsPayloadFromForm(
  formData: FormData,
  uploadedImage?: string,
): CmsNewsPayload {
  const publishedDate = required(formData, "publishedAt", "Дата публикации", 10);
  const timestamp = Date.parse(`${publishedDate}T12:00:00.000Z`);
  const [year, month, day] = publishedDate.split("-").map(Number);
  const calendarProbe = new Date(Date.UTC(year, month - 1, day));

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(publishedDate) ||
    !Number.isFinite(timestamp) ||
    calendarProbe.getUTCFullYear() !== year ||
    calendarProbe.getUTCMonth() !== month - 1 ||
    calendarProbe.getUTCDate() !== day
  ) {
    throw new CmsFormError("Укажите корректную дату публикации");
  }

  return {
    category: enumValue(formData, "category", "Категория", newsCategories),
    content: parseTextBlocks(required(formData, "content", "Текст новости", 100_000)),
    description: required(formData, "description", "Краткое описание", 700),
    image: safeImageUrl(
      uploadedImage ?? required(formData, "image", "Обложка", 2000),
      "Обложка",
    ),
    publishedAt: new Date(timestamp).toISOString(),
    tag: required(formData, "tag", "Метка", 80),
    title: required(formData, "title", "Заголовок", 220),
  };
}

export function getEditableNewsPayload(entity?: CmsNewsEntity) {
  return entity?.draft ?? entity?.published;
}
