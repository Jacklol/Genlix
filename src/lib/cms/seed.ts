import { getProductBySlug } from "@/lib/catalog";
import {
  catalogProducts,
  type CatalogProductSlug,
} from "@/lib/catalog/products";
import { newsArticles } from "@/lib/news";

import {
  CMS_SCHEMA_VERSION,
  normalizeCmsContent,
  type CmsContent,
  type CmsNewsEntity,
  type CmsProductCategory,
  type CmsProductEntity,
} from "./types";

export const LEGACY_CMS_SNAPSHOT_TIMESTAMP = "2026-08-31T00:00:00.000Z";
export const LEGACY_CMS_PRODUCT_COUNT = 24;
export const LEGACY_CMS_NEWS_COUNT = 8;

const productCategoryBySlug = {
  "govyazhij-farsh-domashnij": "meat",
  "antrekot-ohlazhdyonnyj-b2b": "meat",
  "gulyash-iz-govyadiny": "meat",
  "file-kurinoe-ohlazhdennoye": "meat",
  "kotlety-domashnie-iz-svininy": "meat",
  "steyk-ribaj-prajm": "meat",
  "steyk-striploin": "meat",
  "file-minon-tenderloin": "meat",
  "steyk-ribaj-prajm-primebeef": "meat",
  "tolstyj-kraj": "meat",
  "steyk-ribaj-v-vakuume": "meat",
  "steyk-nyu-york": "meat",
  "paulaner-hefe-weissbier": "beer",
  "guinness-draught": "beer",
  "chimay-blue": "beer",
  "pilsner-urquell": "beer",
  "brewdog-punk-ipa": "beer",
  hoegaarden: "beer",
  "file-kurinoe-fermerskoe": "bird",
  "utinaya-grudka": "bird",
  "indejka-file-grudki": "bird",
  "perepel-tushka": "bird",
  "kurinye-bedra": "bird",
  "krylya-kurinye": "bird",
} satisfies Record<CatalogProductSlug, CmsProductCategory>;

export function getLegacyProductId(slug: string) {
  return `legacy:product:${slug}`;
}

export function getLegacyNewsId(slug: string) {
  return `legacy:news:${slug}`;
}

function buildProductEntities(): CmsProductEntity[] {
  const products = Object.values(catalogProducts);

  if (products.length !== LEGACY_CMS_PRODUCT_COUNT) {
    throw new Error(
      `Legacy catalog count changed: expected ${LEGACY_CMS_PRODUCT_COUNT}, received ${products.length}`,
    );
  }

  return products.map((product, sortOrder) => {
    const detail = getProductBySlug(product.slug);

    if (!detail) {
      throw new Error(`Missing ProductDetailData for legacy product: ${product.slug}`);
    }

    const category = productCategoryBySlug[product.slug as CatalogProductSlug];

    if (!category) {
      throw new Error(`Missing CMS category for legacy product: ${product.slug}`);
    }

    const { slug: catalogSlug, ...catalog } = product;
    const { slug: detailSlug, ...detailPayload } = detail;

    if (catalogSlug !== detailSlug) {
      throw new Error(
        `Catalog/detail slug mismatch: ${catalogSlug} !== ${detailSlug}`,
      );
    }

    return {
      id: getLegacyProductId(catalogSlug),
      slug: catalogSlug,
      status: "published",
      published: {
        category,
        catalog,
        detail: detailPayload,
      },
      createdAt: LEGACY_CMS_SNAPSHOT_TIMESTAMP,
      updatedAt: LEGACY_CMS_SNAPSHOT_TIMESTAMP,
      sortOrder,
    };
  });
}

function legacyNewsPublishedAt(dateTime: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateTime)) {
    throw new Error(`Invalid legacy news dateTime: ${dateTime}`);
  }

  return `${dateTime}T00:00:00.000Z`;
}

function buildNewsEntities(): CmsNewsEntity[] {
  if (newsArticles.length !== LEGACY_CMS_NEWS_COUNT) {
    throw new Error(
      `Legacy news count changed: expected ${LEGACY_CMS_NEWS_COUNT}, received ${newsArticles.length}`,
    );
  }

  return newsArticles.map((article, sortOrder) => ({
    id: getLegacyNewsId(article.slug),
    slug: article.slug,
    status: "published",
    published: {
      tag: article.tag,
      category: article.category,
      publishedAt: legacyNewsPublishedAt(article.dateTime),
      title: article.title,
      description: article.description,
      image: article.image,
      content: article.content,
    },
    createdAt: LEGACY_CMS_SNAPSHOT_TIMESTAMP,
    updatedAt: LEGACY_CMS_SNAPSHOT_TIMESTAMP,
    sortOrder,
  }));
}

/**
 * Builds a deterministic, validated JSON-ready snapshot of all legacy content.
 * Calling this function repeatedly with the same source data returns equal data.
 */
export function buildLegacyCmsSeed(): CmsContent {
  return normalizeCmsContent({
    schemaVersion: CMS_SCHEMA_VERSION,
    products: buildProductEntities(),
    news: buildNewsEntities(),
  });
}

export const legacyCmsSeed: CmsContent = buildLegacyCmsSeed();
