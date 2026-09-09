import type { CatalogProduct, ProductDetailData } from "@/lib/catalog/types";
import type { NewsCategory } from "@/lib/news";
import type { TextContentBlock } from "@/lib/text-content";
import { normalizeRichDocument } from "@/lib/rich-text";

export const CMS_SCHEMA_VERSION = 3 as const;
export function isSupportedCmsSchemaVersion(value: unknown): value is 1 | 2 | 3 {
  return value === 1 || value === 2 || value === CMS_SCHEMA_VERSION;
}

const MAX_CMS_SNAPSHOT_BYTES = 8 * 1024 * 1024;
const MAX_PRODUCTS = 2_000;
const MAX_NEWS_ARTICLES = 2_000;
const MAX_GENERIC_STRING_LENGTH = 100_000;
const MAX_GENERIC_LIST_LENGTH = 200;

export type CmsEntityStatus = "published" | "draft" | "archived";
export type CmsProductCategory = "meat" | "beer" | "bird" | "water";
export type CmsIsoDateTime = string;

export type CmsEntity<TPayload> = {
  id: string;
  slug: string;
  status: CmsEntityStatus;
  published?: TPayload;
  draft?: TPayload;
  createdAt: CmsIsoDateTime;
  updatedAt: CmsIsoDateTime;
  sortOrder: number;
};

/** The slug lives on the CMS entity and is not duplicated inside either snapshot. */
export type CmsProductPayload = {
  category: CmsProductCategory;
  catalog: Omit<CatalogProduct, "slug">;
  detail: Omit<ProductDetailData, "slug">;
};

/**
 * `href` is derived from the entity slug and the display date is formatted from
 * `publishedAt`, so neither is persisted in the CMS payload.
 */
export type CmsNewsPayload = {
  tag: string;
  category: NewsCategory;
  publishedAt: CmsIsoDateTime;
  title: string;
  description: string;
  image: string;
  content: TextContentBlock[];
};

export type CmsProductEntity = CmsEntity<CmsProductPayload>;
export type CmsNewsEntity = CmsEntity<CmsNewsPayload>;

export type CmsContent = {
  schemaVersion: 1 | 2 | typeof CMS_SCHEMA_VERSION;
  products: CmsProductEntity[];
  news: CmsNewsEntity[];
};

export class CmsContentValidationError extends TypeError {
  readonly path: string;

  constructor(path: string, message: string) {
    super(`${path}: ${message}`);
    this.name = "CmsContentValidationError";
    this.path = path;
  }
}

type UnknownRecord = Record<string, unknown>;

const entityStatuses = ["published", "draft", "archived"] as const;
const productCategories = ["meat", "beer", "bird", "water"] as const;
const newsCategories = ["cases", "supplies", "cooking", "farms"] as const;
const productBadges = ["хит", "new", "витрина", "ферма"] as const;
const meatChannels = ["horeca", "retail", "both"] as const;
const meatSpecies = ["beef", "lamb", "pork", "poultry"] as const;
const meatProductTypes = [
  "steak",
  "large-cut",
  "minced-meat",
  "goulash",
  "fillet",
  "cutlets",
] as const;
const meatPackaging = ["large-block", "fixed-weight-vacuum", "tray-or-box"] as const;
const meatCookingMethods = ["grill", "fry", "braise", "bake", "boil"] as const;

function validationError(path: string, message: string): never {
  throw new CmsContentValidationError(path, message);
}

function normalizeRecord(value: unknown, path: string): UnknownRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    validationError(path, "expected an object");
  }

  return value as UnknownRecord;
}

function assertKnownKeys(
  record: UnknownRecord,
  allowedKeys: readonly string[],
  path: string,
) {
  const allowed = new Set(allowedKeys);
  const unknownKey = Object.keys(record).find((key) => !allowed.has(key));

  if (unknownKey) {
    validationError(
      `${path}.${unknownKey}`,
      "unknown field; update CMS_SCHEMA_VERSION before changing the data shape",
    );
  }
}

function assertArray(value: unknown, path: string, maxLength = MAX_GENERIC_LIST_LENGTH) {
  if (!Array.isArray(value)) {
    validationError(path, "expected an array");
  }

  if (value.length > maxLength) {
    validationError(path, `must contain no more than ${maxLength} items`);
  }

  return value;
}

function normalizeString(
  value: unknown,
  path: string,
  maxLength = MAX_GENERIC_STRING_LENGTH,
): string {
  if (typeof value !== "string" || value.length === 0) {
    validationError(path, "expected a non-empty string");
  }

  if (value.length > maxLength) {
    validationError(path, `must not exceed ${maxLength} characters`);
  }

  return value;
}

function normalizeOptionalString(
  record: UnknownRecord,
  key: string,
  path: string,
): string | undefined {
  const value = record[key];
  return value === undefined ? undefined : normalizeString(value, `${path}.${key}`);
}

function getAllowedMediaHosts() {
  const hosts = new Set(
    (process.env.CMS_ALLOWED_MEDIA_HOSTS ?? "")
      .split(",")
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean),
  );
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (supabaseUrl) {
    try {
      hosts.add(new URL(supabaseUrl).host.toLowerCase());
    } catch {
      validationError("environment.SUPABASE_URL", "expected a valid URL");
    }
  }

  return hosts;
}

/** Validate a stored media path before it can reach CSS url() or an image element. */
export function normalizeCmsImageUrl(value: unknown, path = "image"): string {
  const source = normalizeString(value, path, 2_000);

  if (/^\/(?!\/)[A-Za-z0-9._~!$&'()*+,;=:@%/?#-]+$/.test(source)) {
    return source;
  }

  let url: URL;

  try {
    url = new URL(source);
  } catch {
    return validationError(path, "expected a safe local media path or HTTPS URL");
  }

  const allowedHosts = getAllowedMediaHosts();

  if (
    url.protocol !== "https:" ||
    url.username !== "" ||
    url.password !== "" ||
    !allowedHosts.has(url.host.toLowerCase())
  ) {
    return validationError(path, "media URL host is not allowed");
  }

  return url.href;
}

/** Validate links persisted by the CMS. JavaScript/data URLs are never allowed. */
export function normalizeCmsLink(value: unknown, path = "link"): string {
  const source = normalizeString(value, path, 2_000);

  if (/^\/(?!\/)[^\u0000-\u001f\u007f\s"'<>]*$/.test(source)) {
    return source;
  }

  let url: URL;

  try {
    url = new URL(source);
  } catch {
    return validationError(path, "expected a local path or HTTPS URL");
  }

  if (url.protocol !== "https:" || url.username !== "" || url.password !== "") {
    return validationError(path, "only local paths and HTTPS URLs are allowed");
  }

  return url.href;
}

function normalizeStringArray(value: unknown, path: string): string[] {
  return assertArray(value, path).map((item, index) =>
    normalizeString(item, `${path}[${index}]`, 2_000),
  );
}

function normalizeEnum<TValue extends string>(
  value: unknown,
  allowed: readonly TValue[],
  path: string,
): TValue {
  if (typeof value !== "string" || !allowed.includes(value as TValue)) {
    validationError(path, `expected one of: ${allowed.join(", ")}`);
  }

  return value as TValue;
}

function normalizeIsoDateTime(value: unknown, path: string): CmsIsoDateTime {
  const source = normalizeString(value, path);
  const isoDateTimePattern =
    /^(\d{4})-(\d{2})-(\d{2})T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;
  const match = source.match(isoDateTimePattern);
  const timestamp = Date.parse(source);

  if (!match || !Number.isFinite(timestamp)) {
    validationError(path, "expected a valid ISO date-time");
  }

  const [, yearSource, monthSource, daySource] = match;
  const year = Number(yearSource);
  const month = Number(monthSource);
  const day = Number(daySource);
  const calendarProbe = new Date(Date.UTC(year, month - 1, day));

  if (
    calendarProbe.getUTCFullYear() !== year ||
    calendarProbe.getUTCMonth() !== month - 1 ||
    calendarProbe.getUTCDate() !== day
  ) {
    validationError(path, "expected a real calendar date");
  }

  return new Date(timestamp).toISOString();
}

function normalizeSortOrder(value: unknown, path: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    validationError(path, "expected a non-negative safe integer");
  }

  return value as number;
}

function normalizeSpecs(value: unknown, path: string) {
  return assertArray(value, path, 100).map((item, index) => {
    const itemPath = `${path}[${index}]`;
    const record = normalizeRecord(item, itemPath);
    assertKnownKeys(record, ["label", "value"], itemPath);

    return {
      label: normalizeString(record.label, `${itemPath}.label`, 160),
      value: normalizeString(record.value, `${itemPath}.value`, 500),
    };
  });
}

function normalizeMeatMetadata(value: unknown, path: string) {
  const record = normalizeRecord(value, path);
  assertKnownKeys(
    record,
    ["channel", "species", "country", "productType", "packaging", "cutIds", "cooking"],
    path,
  );

  return {
    channel: normalizeEnum(record.channel, meatChannels, `${path}.channel`),
    species: normalizeEnum(record.species, meatSpecies, `${path}.species`),
    country: normalizeString(record.country, `${path}.country`, 40),
    productType: normalizeEnum(record.productType, meatProductTypes, `${path}.productType`),
    packaging: normalizeEnum(record.packaging, meatPackaging, `${path}.packaging`),
    cutIds: normalizeStringArray(record.cutIds, `${path}.cutIds`),
    cooking: (() => {
      if (!Array.isArray(record.cooking)) {
        validationError(`${path}.cooking`, "expected an array");
      }

      return record.cooking.map((method, index) =>
        normalizeEnum(method, meatCookingMethods, `${path}.cooking[${index}]`),
      );
    })(),
  };
}

function normalizeCatalogProduct(value: unknown, path: string): Omit<CatalogProduct, "slug"> {
  const record = normalizeRecord(value, path);
  assertKnownKeys(
    record,
    [
      "title",
      "brand",
      "image",
      "specs",
      "tags",
      "recommendation",
      "buttonLabel",
      "badge",
      "meat",
    ],
    path,
  );
  const tags = record.tags === undefined ? undefined : normalizeStringArray(record.tags, `${path}.tags`);
  const recommendation = normalizeOptionalString(record, "recommendation", path);
  const buttonLabel = normalizeOptionalString(record, "buttonLabel", path);
  const badge =
    record.badge === undefined
      ? undefined
      : normalizeEnum(record.badge, productBadges, `${path}.badge`);
  const meat =
    record.meat === undefined
      ? undefined
      : normalizeMeatMetadata(record.meat, `${path}.meat`);

  return {
    title: normalizeString(record.title, `${path}.title`, 220),
    brand: normalizeString(record.brand, `${path}.brand`, 120),
    image: normalizeCmsImageUrl(record.image, `${path}.image`),
    specs: normalizeSpecs(record.specs, `${path}.specs`),
    ...(tags === undefined ? {} : { tags }),
    ...(recommendation === undefined ? {} : { recommendation }),
    ...(buttonLabel === undefined ? {} : { buttonLabel }),
    ...(badge === undefined ? {} : { badge }),
    ...(meat === undefined ? {} : { meat }),
  };
}

function normalizeBreadcrumbs(value: unknown, path: string) {
  return assertArray(value, path, 12).map((item, index) => {
    const itemPath = `${path}[${index}]`;
    const record = normalizeRecord(item, itemPath);
    assertKnownKeys(record, ["label", "href"], itemPath);
    const href = normalizeOptionalString(record, "href", itemPath);

    return {
      label: normalizeString(record.label, `${itemPath}.label`, 160),
      ...(href === undefined ? {} : { href: normalizeCmsLink(href, `${itemPath}.href`) }),
    };
  });
}

function normalizeProductDetail(
  value: unknown,
  path: string,
): Omit<ProductDetailData, "slug"> {
  const record = normalizeRecord(value, path);
  assertKnownKeys(
    record,
    [
      "breadcrumbs",
      "images",
      "brand",
      "category",
      "title",
      "packaging",
      "description",
      "shelfLife",
      "storage",
      "cookingMethods",
      "beerRecommendationLabel",
      "buttonLabel",
      "buttonHref",
    ],
    path,
  );
  const beerRecommendationLabel = normalizeOptionalString(
    record,
    "beerRecommendationLabel",
    path,
  );
  const buttonLabel = normalizeOptionalString(record, "buttonLabel", path);
  const buttonHref = normalizeOptionalString(record, "buttonHref", path);

  return {
    breadcrumbs: normalizeBreadcrumbs(record.breadcrumbs, `${path}.breadcrumbs`),
    images: normalizeStringArray(record.images, `${path}.images`).map((image, index) =>
      normalizeCmsImageUrl(image, `${path}.images[${index}]`),
    ),
    brand: normalizeString(record.brand, `${path}.brand`, 120),
    category: normalizeString(record.category, `${path}.category`, 160),
    title: normalizeString(record.title, `${path}.title`, 220),
    packaging: normalizeString(record.packaging, `${path}.packaging`, 300),
    description: normalizeString(record.description, `${path}.description`, 5_000),
    shelfLife: normalizeString(record.shelfLife, `${path}.shelfLife`, 300),
    storage: normalizeString(record.storage, `${path}.storage`, 500),
    cookingMethods: normalizeStringArray(record.cookingMethods, `${path}.cookingMethods`),
    ...(beerRecommendationLabel === undefined ? {} : { beerRecommendationLabel }),
    ...(buttonLabel === undefined ? {} : { buttonLabel }),
    ...(buttonHref === undefined
      ? {}
      : { buttonHref: normalizeCmsLink(buttonHref, `${path}.buttonHref`) }),
  };
}

function normalizeProductPayload(value: unknown, path: string): CmsProductPayload {
  const record = normalizeRecord(value, path);
  assertKnownKeys(record, ["category", "catalog", "detail"], path);
  const catalog = normalizeCatalogProduct(record.catalog, `${path}.catalog`);
  const detail = normalizeProductDetail(record.detail, `${path}.detail`);

  if (catalog.title !== detail.title) {
    validationError(path, "catalog.title and detail.title must match");
  }

  if (catalog.brand !== detail.brand) {
    validationError(path, "catalog.brand and detail.brand must match");
  }

  return {
    category: normalizeEnum(record.category, productCategories, `${path}.category`),
    catalog,
    detail,
  };
}

function normalizeContentBlocks(value: unknown, path: string): TextContentBlock[] {
  return assertArray(value, path, 500).map((item, index) => {
    const itemPath = `${path}[${index}]`;
    const record = normalizeRecord(item, itemPath);

    if (record.type === "richText") {
      try {
        return normalizeRichDocument(record, { image: normalizeCmsImageUrl, link: normalizeCmsLink });
      } catch (error) {
        return validationError(itemPath, error instanceof Error ? error.message : "invalid rich text");
      }
    }

    if (record.type === "paragraph" || record.type === "heading") {
      assertKnownKeys(record, ["type", "text"], itemPath);
      return {
        type: record.type,
        text: normalizeString(record.text, `${itemPath}.text`, 20_000),
      };
    }

    if (record.type === "list") {
      assertKnownKeys(record, ["type", "items"], itemPath);
      return {
        type: "list",
        items: normalizeStringArray(record.items, `${itemPath}.items`),
      };
    }

    return validationError(`${itemPath}.type`, "expected paragraph, heading, or list");
  });
}

function normalizeNewsPayload(value: unknown, path: string): CmsNewsPayload {
  const record = normalizeRecord(value, path);
  assertKnownKeys(
    record,
    ["tag", "category", "publishedAt", "title", "description", "image", "content"],
    path,
  );

  return {
    tag: normalizeString(record.tag, `${path}.tag`, 80),
    category: normalizeEnum(record.category, newsCategories, `${path}.category`),
    publishedAt: normalizeIsoDateTime(record.publishedAt, `${path}.publishedAt`),
    title: normalizeString(record.title, `${path}.title`, 220),
    description: normalizeString(record.description, `${path}.description`, 700),
    image: normalizeCmsImageUrl(record.image, `${path}.image`),
    content: normalizeContentBlocks(record.content, `${path}.content`),
  };
}

function normalizeEntity<TPayload>(
  value: unknown,
  path: string,
  normalizePayload: (value: unknown, path: string) => TPayload,
): CmsEntity<TPayload> {
  const record = normalizeRecord(value, path);
  assertKnownKeys(
    record,
    ["id", "slug", "status", "published", "draft", "createdAt", "updatedAt", "sortOrder"],
    path,
  );
  const slug = normalizeString(record.slug, `${path}.slug`);

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    validationError(`${path}.slug`, "expected a lowercase URL slug");
  }

  const createdAt = normalizeIsoDateTime(record.createdAt, `${path}.createdAt`);
  const updatedAt = normalizeIsoDateTime(record.updatedAt, `${path}.updatedAt`);

  if (Date.parse(updatedAt) < Date.parse(createdAt)) {
    validationError(`${path}.updatedAt`, "must not be earlier than createdAt");
  }

  const draft =
    record.draft === undefined
      ? undefined
      : normalizePayload(record.draft, `${path}.draft`);
  const published =
    record.published === undefined
      ? undefined
      : normalizePayload(record.published, `${path}.published`);
  const status = normalizeEnum(record.status, entityStatuses, `${path}.status`);

  if (status === "published" && published === undefined) {
    validationError(`${path}.published`, "is required when status is published");
  }

  if (status === "draft" && draft === undefined) {
    validationError(`${path}.draft`, "is required when status is draft");
  }

  if (status === "archived" && published === undefined && draft === undefined) {
    validationError(path, "an archived entity requires a published or draft payload");
  }

  return {
    id: normalizeString(record.id, `${path}.id`, 200),
    slug,
    status,
    ...(published === undefined ? {} : { published }),
    ...(draft === undefined ? {} : { draft }),
    createdAt,
    updatedAt,
    sortOrder: normalizeSortOrder(record.sortOrder, `${path}.sortOrder`),
  };
}

function assertUniqueEntities<TPayload>(
  entities: CmsEntity<TPayload>[],
  path: string,
): void {
  const ids = new Set<string>();
  const slugs = new Set<string>();
  const sortOrders = new Set<number>();

  entities.forEach((entity, index) => {
    if (ids.has(entity.id)) {
      validationError(`${path}[${index}].id`, `duplicate id: ${entity.id}`);
    }

    if (slugs.has(entity.slug)) {
      validationError(`${path}[${index}].slug`, `duplicate slug: ${entity.slug}`);
    }

    if (sortOrders.has(entity.sortOrder)) {
      validationError(
        `${path}[${index}].sortOrder`,
        `duplicate sortOrder: ${entity.sortOrder}`,
      );
    }

    ids.add(entity.id);
    slugs.add(entity.slug);
    sortOrders.add(entity.sortOrder);
  });
}

function compareEntities<TPayload>(left: CmsEntity<TPayload>, right: CmsEntity<TPayload>) {
  return left.sortOrder - right.sortOrder || left.slug.localeCompare(right.slug, "en");
}

/** Parse, validate, clone, and deterministically order a JSON CMS snapshot. */
export function normalizeCmsContent(value: unknown): CmsContent {
  let encodedSize = 0;

  try {
    encodedSize = new TextEncoder().encode(JSON.stringify(value)).byteLength;
  } catch {
    validationError("$", "content must be serializable JSON");
  }

  if (encodedSize > MAX_CMS_SNAPSHOT_BYTES) {
    validationError("$", `snapshot must not exceed ${MAX_CMS_SNAPSHOT_BYTES} bytes`);
  }

  const record = normalizeRecord(value, "$");
  assertKnownKeys(record, ["schemaVersion", "products", "news"], "$");

  if (!isSupportedCmsSchemaVersion(record.schemaVersion)) {
    validationError("$.schemaVersion", `expected 1, 2 or ${CMS_SCHEMA_VERSION}`);
  }

  const productRecords = assertArray(record.products, "$.products", MAX_PRODUCTS);
  const newsRecords = assertArray(record.news, "$.news", MAX_NEWS_ARTICLES);

  const products = productRecords.map((entity, index) =>
    normalizeEntity(entity, `$.products[${index}]`, normalizeProductPayload),
  );
  const news = newsRecords.map((entity, index) =>
    normalizeEntity(entity, `$.news[${index}]`, normalizeNewsPayload),
  );
  if (record.schemaVersion === 1 && news.some((entity) => [entity.draft, entity.published].some((payload) => payload?.content.some((block) => block.type === "richText")))) {
    validationError("$.schemaVersion", "rich text requires schema version 2");
  }
  if (record.schemaVersion < 3 && products.some((entity) => [entity.draft, entity.published].some((payload) => payload?.category === "water" || payload?.catalog.meat?.channel === "both"))) {
    validationError("$.schemaVersion", "water and dual sales channels require schema version 3");
  }

  assertUniqueEntities(products, "$.products");
  assertUniqueEntities(news, "$.news");

  const entityIds = new Set(products.map((entity) => entity.id));
  news.forEach((entity, index) => {
    if (entityIds.has(entity.id)) {
      validationError(`$.news[${index}].id`, `duplicate global entity id: ${entity.id}`);
    }
  });

  return {
    schemaVersion: record.schemaVersion,
    products: products.sort(compareEntities),
    news: news.sort(compareEntities),
  };
}

export function isCmsContent(value: unknown): value is CmsContent {
  try {
    normalizeCmsContent(value);
    return true;
  } catch {
    return false;
  }
}
