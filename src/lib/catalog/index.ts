import type { CatalogProduct } from "@/components/CatalogProductsSection";
import { meatCutRegions } from "@/lib/meat-cuts";

import { productDetails, productDetailSlugs } from "./details";
import { catalogProducts } from "./products";
import {
  beerSection,
  birdSection,
  miratorgSections,
  primebeefHorecaCompact,
  primebeefRetailCompact,
  primebeefSections,
  similarProductsBySlug,
} from "./sections";
import type {
  CatalogProduct as CatalogProductRecord,
  CompactCatalogProduct,
  MeatCookingMethod,
  MeatCountry,
  MeatManufacturer,
  MeatPackaging,
  MeatProductMetadata,
  MeatProductType,
  MeatSalesChannel,
  MeatSpecies,
  ProductCardData,
  ProductDetailData,
  ProductPlacement,
} from "./types";

export type {
  ProductDetailData,
  ProductCardData,
  CompactCatalogProduct,
  MeatCookingMethod,
  MeatCountry,
  MeatManufacturer,
  MeatPackaging,
  MeatProductMetadata,
  MeatProductType,
  MeatSalesChannel,
  MeatSpecies,
};
export { meatSpecs, birdSpecs } from "./specs";
export { catalogProducts } from "./products";
export const GOVYAZHIJ_FARSH_SLUG = "govyazhij-farsh-domashnij";

export type MeatFilterOption<TValue extends string> = {
  value: TValue;
  label: string;
};

export type MeatCatalogFilters = {
  channel?: MeatSalesChannel;
  species?: MeatSpecies;
  manufacturer?: MeatManufacturer;
  country?: MeatCountry;
  productType?: MeatProductType;
  packaging?: MeatPackaging;
  cutId?: string;
  cooking?: MeatCookingMethod;
};

export type MeatCatalogItem = ProductCardData & {
  slug: string;
  meat: MeatProductMetadata;
};

export const meatFilterOptions = {
  channels: [
    { value: "horeca", label: "HoReCa" },
    { value: "retail", label: "Ритейл" },
  ] satisfies MeatFilterOption<MeatSalesChannel>[],
  species: [
    { value: "beef", label: "Говядина" },
    { value: "lamb", label: "Баранина" },
    { value: "pork", label: "Свинина" },
    { value: "poultry", label: "Птица" },
  ] satisfies MeatFilterOption<MeatSpecies>[],
  manufacturers: [
    { value: "Primebeef", label: "Primebeef" },
    { value: "Мираторг", label: "Мираторг" },
  ] satisfies MeatFilterOption<MeatManufacturer>[],
  countries: [
    { value: "russia", label: "Россия" },
  ] satisfies MeatFilterOption<MeatCountry>[],
  productTypes: [
    { value: "steak", label: "Стейки" },
    { value: "large-cut", label: "Крупные отрубы" },
    { value: "minced-meat", label: "Фарш" },
    { value: "goulash", label: "Гуляш" },
    { value: "fillet", label: "Филе" },
    { value: "cutlets", label: "Котлеты" },
  ] satisfies MeatFilterOption<MeatProductType>[],
  packaging: [
    { value: "large-block", label: "Крупный блок" },
    { value: "fixed-weight-vacuum", label: "Вакуум, фиксированный вес" },
    { value: "tray-or-box", label: "Лоток / короб" },
  ] satisfies MeatFilterOption<MeatPackaging>[],
  cooking: [
    { value: "grill", label: "Гриль" },
    { value: "fry", label: "Жарка" },
    { value: "braise", label: "Тушение" },
    { value: "bake", label: "Запекание" },
    { value: "boil", label: "Варка" },
  ] satisfies MeatFilterOption<MeatCookingMethod>[],
} as const;

type MeatCatalogQuery = Record<string, string | string[] | undefined>;

function getQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getFilterOptionValue<TValue extends string>(
  value: string | undefined,
  options: readonly MeatFilterOption<TValue>[],
) {
  return options.find((option) => option.value === value)?.value;
}

export function parseMeatCatalogFilters(query: MeatCatalogQuery): MeatCatalogFilters {
  const manufacturer = getQueryValue(query.manufacturer)?.trim();
  const country = getQueryValue(query.country)?.trim();

  return {
    species: getFilterOptionValue(getQueryValue(query.species), meatFilterOptions.species),
    manufacturer:
      manufacturer && manufacturer.length <= 100 ? manufacturer : undefined,
    country: country && /^[a-z0-9-]{2,40}$/i.test(country) ? country : undefined,
    packaging: getFilterOptionValue(
      getQueryValue(query.packaging),
      meatFilterOptions.packaging,
    ),
    channel: getFilterOptionValue(getQueryValue(query.channel), meatFilterOptions.channels),
    cutId: meatCutRegions.find(
      (region) => region.enabled !== false && region.id === getQueryValue(query.cutId),
    )?.id,
  };
}

function getProduct(slug: string): CatalogProductRecord {
  const product = catalogProducts[slug as keyof typeof catalogProducts];

  if (!product) {
    throw new Error(`Unknown catalog product slug: ${slug}`);
  }

  return product;
}

function hasMeatMetadata(
  product: CatalogProductRecord,
): product is CatalogProductRecord & { meat: MeatProductMetadata } {
  return product.meat !== undefined;
}

function matchesMeatFilters(
  product: CatalogProductRecord & { meat: MeatProductMetadata },
  filters: MeatCatalogFilters,
) {
  const { meat } = product;

  return (
    (!filters.channel || meat.channel === filters.channel) &&
    (!filters.species || meat.species === filters.species) &&
    (!filters.manufacturer || product.brand === filters.manufacturer) &&
    (!filters.country || meat.country === filters.country) &&
    (!filters.productType || meat.productType === filters.productType) &&
    (!filters.packaging || meat.packaging === filters.packaging) &&
    (!filters.cutId || meat.cutIds.includes(filters.cutId)) &&
    (!filters.cooking || meat.cooking.includes(filters.cooking))
  );
}

function resolveMeatItems(
  filters: MeatCatalogFilters,
  brand?: MeatManufacturer,
) {
  const seenSlugs = new Set<string>();

  return Object.values(catalogProducts).flatMap((product) => {
    if (
      !hasMeatMetadata(product) ||
      (brand && product.brand !== brand) ||
      seenSlugs.has(product.slug) ||
      !matchesMeatFilters(product, filters)
    ) {
      return [];
    }

    seenSlugs.add(product.slug);

    return [
      {
        ...resolvePlacement({ slug: product.slug }),
        slug: product.slug,
        meat: product.meat,
      },
    ];
  });
}

function resolveBrandMeatItems(
  brand: MeatManufacturer,
  filters: MeatCatalogFilters,
): MeatCatalogItem[] {
  return resolveMeatItems(filters, brand);
}

export function getAllMeatItems(filters: MeatCatalogFilters = {}) {
  return resolveMeatItems(filters);
}

export function getPrimebeefHorecaMeatItems(
  filters: Omit<MeatCatalogFilters, "channel"> = {},
) {
  return resolveBrandMeatItems("Primebeef", { ...filters, channel: "horeca" });
}

export function getPrimebeefRetailMeatItems(
  filters: Omit<MeatCatalogFilters, "channel"> = {},
) {
  return resolveBrandMeatItems("Primebeef", { ...filters, channel: "retail" });
}

export function getMiratorgMeatItems(filters: MeatCatalogFilters = {}) {
  return resolveBrandMeatItems("Мираторг", filters);
}

export function getMiratorgRetailMeatItems(
  filters: Omit<MeatCatalogFilters, "channel"> = {},
) {
  return resolveBrandMeatItems("Мираторг", { ...filters, channel: "retail" });
}

export function resolvePlacement(placement: ProductPlacement): ProductCardData {
  const product = getProduct(placement.slug);

  return {
    ...(productDetailSlugs.has(product.slug) ? { slug: product.slug } : {}),
    image: placement.image ?? product.image,
    badge: placement.badge ?? product.badge,
    brand: placement.brand ?? product.brand,
    title: product.title,
    specs: product.specs,
    tags: product.tags,
    recommendation: product.recommendation,
    buttonLabel: placement.buttonLabel ?? product.buttonLabel,
  };
}

export function resolvePlacements(placements: readonly ProductPlacement[]): ProductCardData[] {
  return placements.map(resolvePlacement);
}

export function resolveCompactProducts(items: readonly CompactCatalogProduct[]): CatalogProduct[] {
  return items.map((item) => ({
    name: item.name,
    meta: item.meta,
    image: item.image,
    ...(productDetailSlugs.has(item.slug) ? { href: `/catalog/product/${item.slug}` } : {}),
  }));
}

export function getMiratorgSection(section: keyof typeof miratorgSections) {
  return resolvePlacements(miratorgSections[section]);
}

export function getPrimebeefDetailedProducts() {
  return resolvePlacements(primebeefSections.detailed);
}

export function getPrimebeefHorecaProducts() {
  return resolveCompactProducts(primebeefHorecaCompact);
}

export function getPrimebeefRetailProducts() {
  return resolveCompactProducts(primebeefRetailCompact);
}

export function getBeerProducts() {
  return resolvePlacements(beerSection);
}

export function getBirdProducts() {
  return resolvePlacements(birdSection);
}

export function getProductBySlug(slug: string) {
  return productDetails.find((product) => product.slug === slug) ?? null;
}

export function getAllProductSlugs() {
  return productDetails.map((product) => product.slug);
}

export function getSimilarProducts(slug: string) {
  const placements = similarProductsBySlug[slug] ?? [];
  return resolvePlacements(placements);
}
