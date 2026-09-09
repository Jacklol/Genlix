import { cache } from "react";

import type { ProductCardData } from "@/components/ProductCard";
import type { MeatCatalogItem, ProductDetailData } from "@/lib/catalog";
import { meatFilterOptions } from "@/lib/catalog";
import { getMeatCatalogSpecs, getMeatDetailSpecs } from "@/lib/catalog/meat-characteristics";
import type { ProductSpec } from "@/lib/catalog/types";
import { similarProductsBySlug } from "@/lib/catalog/sections";
import { categoryDetailSpecs, categoryFields, countryLabels, hasSpecValue, unmanagedCategorySpecs, type CatalogCategory, type FilteredCategory } from "@/lib/catalog/category-fields";
import { availableFilterOptions, commonFilterKeys, productFilterValues, type CategoryCatalogItem, type FilterOption } from "@/lib/catalog/filter-engine";
import type { NewsArticle } from "@/lib/news";

import { loadCmsSnapshot } from "./store";
import type {
  CmsNewsEntity,
  CmsNewsPayload,
  CmsProductEntity,
  CmsProductPayload,
} from "./types";

// Public pages often ask for the same snapshot from generateMetadata and the
// page render (or from several repository helpers). React clears this cache for
// every server request, so it deduplicates Supabase reads without serving stale
// CMS content to later requests. Admin mutations continue to call the store
// directly and are deliberately outside this cache.
const loadPublishedCmsSnapshot = cache(loadCmsSnapshot);

function isPublicEntity<
  TEntity extends { published?: unknown; status: string },
>(
  entity: TEntity,
): entity is TEntity & {
  published: Exclude<TEntity["published"], undefined>;
  status: "published" | "draft";
} {
  // A published payload remains live while a newer draft is being edited.
  // Archiving is the only operation that removes it from the public site.
  return entity.status !== "archived" && entity.published !== undefined;
}

function productCardFromEntity(entity: CmsProductEntity): ProductCardData {
  const payload = entity.published as CmsProductPayload;
  const catalog = payload.catalog;
  const specs = payload.category === "meat" ? getMeatCatalogSpecs(catalog.specs).map((spec) =>
    spec.label === "Канал поставки" && catalog.meat ? {
      ...spec, value: catalog.meat.channel === "both" ? "HoReCa и ритейл" : catalog.meat.channel === "horeca" ? "HoReCa" : "Ритейл",
    } : spec) : [
      ...catalog.specs.filter((spec) => categoryFields[payload.category as FilteredCategory].some((field) => field.card && field.label === spec.label)),
      ...unmanagedCategorySpecs(catalog.specs),
    ].filter((spec) => hasSpecValue(spec.value));

  return {
    badge: catalog.badge,
    brand: catalog.brand,
    buttonLabel: catalog.buttonLabel,
    image: catalog.image,
    recommendation: catalog.recommendation,
    slug: entity.slug,
    specs,
    tags: catalog.tags,
    title: catalog.title,
  };
}

function productDetailFromEntity(entity: CmsProductEntity): ProductDetailData & { additionalSpecs: ProductSpec[] } {
  const payload = entity.published as CmsProductPayload;
  const packaging = payload.category === "meat" && payload.catalog.meat
    ? meatFilterOptions.packaging.find((option) => option.value === payload.catalog.meat?.packaging)?.label
    : undefined;
  return {
    ...payload.detail,
    cookingMethods: payload.category === "beer" || payload.category === "water" ? [] : payload.detail.cookingMethods,
    additionalSpecs: payload.category === "meat" ? [
      ...(packaging ? [{ label: "Тип упаковки", value: packaging }] : []),
      ...getMeatDetailSpecs(payload.catalog.specs),
    ] : categoryDetailSpecs(payload.category, payload.catalog.specs).map((spec) => spec.label === "Страна производства"
      ? { ...spec, value: countryLabels[spec.value] ?? spec.value } : spec),
    slug: entity.slug,
  };
}

function formatNewsDate(publishedAt: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(publishedAt));
}

function newsArticleFromEntity(entity: CmsNewsEntity): NewsArticle {
  const payload = entity.published as CmsNewsPayload;

  return {
    category: payload.category,
    content: payload.content,
    date: formatNewsDate(payload.publishedAt),
    dateTime: payload.publishedAt.slice(0, 10),
    description: payload.description,
    href: `/news/${entity.slug}`,
    image: payload.image,
    slug: entity.slug,
    tag: payload.tag,
    title: payload.title,
  };
}

async function getPublishedProductEntities() {
  const { snapshot } = await loadPublishedCmsSnapshot();

  return snapshot.content.products
    .filter(isPublicEntity)
    .sort((left, right) => left.sortOrder - right.sortOrder);
}

export async function getPublishedNewsArticles() {
  const { snapshot } = await loadPublishedCmsSnapshot();

  return snapshot.content.news
    .filter(isPublicEntity)
    .sort(
      (left, right) =>
        Date.parse(right.published.publishedAt) - Date.parse(left.published.publishedAt) ||
        left.sortOrder - right.sortOrder,
    )
    .map(newsArticleFromEntity);
}

export async function getPublishedNewsArticleBySlug(slug: string) {
  const { snapshot } = await loadPublishedCmsSnapshot();
  const entity = snapshot.content.news.find(
    (item) => item.slug === slug && isPublicEntity(item),
  );

  return entity ? newsArticleFromEntity(entity as CmsNewsEntity) : null;
}

export async function getPublishedRelatedNewsArticles(slug: string, limit = 3) {
  return (await getPublishedNewsArticles())
    .filter((article) => article.slug !== slug)
    .slice(0, limit);
}

export async function getPublishedMeatItems(): Promise<MeatCatalogItem[]> {
  const entities = await getPublishedProductEntities();

  return entities.flatMap((entity) => {
    const payload = entity.published as CmsProductPayload;
    const meat = payload.catalog.meat;

    if (payload.category !== "meat" || !meat) {
      return [];
    }

    return [
      {
        ...productCardFromEntity(entity),
        slug: entity.slug,
        meat,
      },
    ];
  });
}

export async function getPublishedCategoryProducts(category: "beer" | "bird") {
  const entities = await getPublishedProductEntities();

  return entities
    .filter((entity) => (entity.published as CmsProductPayload).category === category)
    .map(productCardFromEntity);
}

function entityCategoryItem(entity: CmsProductEntity): CategoryCatalogItem {
  const payload = entity.published as CmsProductPayload;
  return {
    ...productCardFromEntity(entity), slug: entity.slug,
    filterValues: payload.category === "meat" && payload.catalog.meat ? {
      manufacturer: payload.catalog.brand, country: payload.catalog.meat.country, channel: payload.catalog.meat.channel,
    } : productFilterValues(payload.category === "meat" ? "bird" : payload.category, payload.catalog.brand, payload.catalog.specs),
  };
}

export async function getPublishedCategoryItems(category: FilteredCategory): Promise<CategoryCatalogItem[]> {
  return (await getPublishedProductEntities()).filter((entity) => {
    const payload = entity.published as CmsProductPayload;
    return payload.category === category || (category === "bird" && payload.category === "meat" && payload.catalog.meat?.species === "poultry");
  }).map((entity) => {
    const payload = entity.published as CmsProductPayload;
    return {
      ...productCardFromEntity(entity), slug: entity.slug,
      filterValues: productFilterValues(category, payload.catalog.brand, payload.catalog.specs, payload.category === "meat" ? payload.catalog.meat : undefined),
    };
  });
}

export async function getCatalogCommonOptions(): Promise<Record<CatalogCategory, Record<string, FilterOption[]>>> {
  const entities = await getPublishedProductEntities();
  return Object.fromEntries((["meat", "bird", "beer", "water"] as const).map((category) => {
    const items = entities.filter((entity) => {
      const payload = entity.published as CmsProductPayload;
      return payload.category === category || (category === "bird" && payload.category === "meat" && payload.catalog.meat?.species === "poultry");
    }).map(entityCategoryItem);
    return [category, Object.fromEntries(commonFilterKeys.map((key) => [key, availableFilterOptions(items, key)]))];
  })) as Record<CatalogCategory, Record<string, FilterOption[]>>;
}

export async function getPublishedProductBySlug(slug: string) {
  const entities = await getPublishedProductEntities();
  const entity = entities.find((item) => item.slug === slug);

  return entity ? productDetailFromEntity(entity) : null;
}

export async function getPublishedProductSlugs() {
  return (await getPublishedProductEntities()).map((entity) => entity.slug);
}

/** A single snapshot read for metadata routes, which run outside RSC rendering. */
export async function getPublishedSitemapEntries() {
  const { snapshot } = await loadPublishedCmsSnapshot();

  return {
    news: snapshot.content.news
      .filter(isPublicEntity)
      .map((entity) => ({
        lastModified: (entity.published as CmsNewsPayload).publishedAt,
        slug: entity.slug,
      })),
    productSlugs: snapshot.content.products
      .filter(isPublicEntity)
      .map((entity) => entity.slug),
  };
}

export async function getPublishedSimilarProducts(slug: string) {
  const entities = await getPublishedProductEntities();
  const entityBySlug = new Map(entities.map((entity) => [entity.slug, entity]));
  const sourceEntity = entityBySlug.get(slug);

  if (!sourceEntity) {
    return [];
  }

  const explicitProducts = (similarProductsBySlug[slug] ?? []).flatMap((placement) => {
    const entity = entityBySlug.get(placement.slug);

    if (!entity) {
      return [];
    }

    const card = productCardFromEntity(entity);

    return [
      {
        ...card,
        badge: placement.badge ?? card.badge,
        brand: placement.brand ?? card.brand,
        buttonLabel: placement.buttonLabel ?? card.buttonLabel,
        image: placement.image ?? card.image,
      },
    ];
  });

  const selectedSlugs = new Set([
    slug,
    ...explicitProducts.flatMap((product) => (product.slug ? [product.slug] : [])),
  ]);
  const sourcePayload = sourceEntity.published as CmsProductPayload;
  const fallbackProducts = entities
    .filter((entity) => !selectedSlugs.has(entity.slug))
    .map((entity) => {
      const payload = entity.published as CmsProductPayload;
      let score = payload.category === sourcePayload.category ? 4 : 0;

      if (payload.catalog.brand === sourcePayload.catalog.brand) {
        score += 2;
      }
      if (
        payload.catalog.meat?.species &&
        payload.catalog.meat.species === sourcePayload.catalog.meat?.species
      ) {
        score += 4;
      }
      if (
        payload.catalog.meat?.channel &&
        payload.catalog.meat.channel === sourcePayload.catalog.meat?.channel
      ) {
        score += 1;
      }

      return { entity, score };
    })
    .filter(({ score }) => score > 0)
    .sort(
      (left, right) =>
        right.score - left.score || left.entity.sortOrder - right.entity.sortOrder,
    )
    .map(({ entity }) => productCardFromEntity(entity));

  return [...explicitProducts, ...fallbackProducts].slice(0, 3);
}
