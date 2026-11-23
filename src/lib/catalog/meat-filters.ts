import type { MeatSalesChannel, MeatSpecies, MeatManufacturer, MeatCountry, MeatProductType, MeatPackaging, MeatCookingMethod, MeatProductMetadata, ProductCardData } from "./types";
export type { MeatSalesChannel, MeatSpecies, MeatManufacturer, MeatCountry, MeatPackaging } from "./types";
import { findCatalogMeatCut } from "./meat-catalog-artwork";
import { matchesChannel } from "./filter-engine";
type DedicatedSpecies = Extract<MeatSpecies, "beef" | "lamb">;

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
    cutId: findCatalogMeatCut(getQueryValue(query.cutId))?.id,
  };
}


export function normalizeMeatCatalogFilters(
  filters: MeatCatalogFilters,
  products: MeatCatalogItem[],
  speciesPage?: DedicatedSpecies,
): MeatCatalogFilters {
  const availableSpecies = new Set(products.map((product) => product.meat.species));
  const species =
    speciesPage ??
    (filters.species && availableSpecies.has(filters.species)
      ? filters.species
      : undefined);
  const candidates = species
    ? products.filter((product) => product.meat.species === species)
    : products;
  const normalized: MeatCatalogFilters = species ? { species } : {};

  if (
    filters.manufacturer &&
    candidates.some((product) => product.brand === filters.manufacturer)
  ) {
    normalized.manufacturer = filters.manufacturer;
  }

  if (
    filters.country &&
    candidates.some((product) => product.meat.country === filters.country)
  ) {
    normalized.country = filters.country;
  }

  if (
    filters.packaging &&
    candidates.some((product) => product.meat.packaging === filters.packaging)
  ) {
    normalized.packaging = filters.packaging;
  }

  if (
    filters.channel &&
    candidates.some((product) => matchesChannel(product.meat.channel, filters.channel))
  ) {
    normalized.channel = filters.channel;
  }

  if (
    speciesPage === "beef" &&
    findCatalogMeatCut(filters.cutId)
  ) {
    normalized.cutId = filters.cutId;
  }

  return normalized;
}
