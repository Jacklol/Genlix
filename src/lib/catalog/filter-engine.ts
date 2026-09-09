import type { ProductCardData, MeatProductMetadata, ProductSpec } from "./types";
import { categoryFields, countryLabels, fieldValue, hasSpecValue, normalizeCountry, type FilteredCategory } from "./category-fields";

export type CatalogFilterValues = Record<string, string | undefined>;
export type FilterOption = { value: string; label: string };
export type CategoryCatalogItem = ProductCardData & { slug: string; filterValues: CatalogFilterValues };
export type CatalogQuery = Record<string, string | string[] | undefined>;
export const commonFilterKeys = ["manufacturer", "country", "channel"] as const;

export function matchesFilter(value: string | readonly string[] | undefined, selected?: string) {
  return !selected || (Array.isArray(value) ? value.includes(selected) : value === selected);
}
export function matchesChannel(value?: string, selected?: string) {
  return matchesFilter(value === "both" ? ["horeca", "retail", "both"] : value, selected);
}
export function productFilterValues(category: FilteredCategory, brand: string, specs: ProductSpec[], meat?: MeatProductMetadata): CatalogFilterValues {
  const values: CatalogFilterValues = { manufacturer: brand };
  for (const field of categoryFields[category]) {
    if (!field.filter) continue;
    const value = fieldValue(specs, field);
    if (!hasSpecValue(value)) continue;
    values[field.filter] = field.filter === "country" ? normalizeCountry(value)
      : field.filter === "channel" ? ({ HoReCa: "horeca", "Ритейл": "retail", "HoReCa / ритейл": "both" }[value] ?? value)
      : value;
  }
  // Legacy poultry stored under meat remains visible; only explicit metadata is used.
  if (meat) {
    values.country = normalizeCountry(meat.country);
    values.channel = meat.channel;
    values.packaging ??= ({ "fixed-weight-vacuum": "Вакуум", "tray-or-box": "Лоток / короб", "large-block": "Крупный блок" })[meat.packaging];
  }
  return values;
}
export function filterCategoryProducts(products: CategoryCatalogItem[], filters: CatalogFilterValues) {
  return products.filter((product) => Object.entries(filters).every(([key, value]) => key === "channel"
    ? matchesChannel(product.filterValues[key], value)
    : matchesFilter(product.filterValues[key], value)));
}
export function filterLabel(key: string, value: string) {
  if (key === "country") return countryLabels[value] ?? value;
  if (key === "channel") return ({ horeca: "HoReCa", retail: "Ритейл", both: "HoReCa / ритейл" })[value] ?? value;
  if (key === "volume") return `${value} мл`;
  return value;
}
export function availableFilterOptions(products: CategoryCatalogItem[], key: string): FilterOption[] {
  const values = products.flatMap((product) => {
    const value = product.filterValues[key];
    return !value ? [] : key === "channel" && value === "both" ? ["horeca", "retail"] : [value];
  });
  return [...new Set(values)].map((value) => ({ value, label: filterLabel(key, value) }))
    .sort((a, b) => a.label.localeCompare(b.label, "ru", { numeric: true }));
}
export function categoryFilterKeys(category: FilteredCategory) {
  return ["manufacturer", ...categoryFields[category].flatMap((field) => field.filter ? [field.filter] : [])];
}
export function parseCategoryFilters(category: FilteredCategory, query: CatalogQuery, products: CategoryCatalogItem[]): CatalogFilterValues {
  return Object.fromEntries(categoryFilterKeys(category).flatMap((key) => {
    const raw = query[key];
    const value = (Array.isArray(raw) ? raw[0] : raw)?.trim();
    return value && value.length <= 160 && availableFilterOptions(products, key).some((option) => option.value === value) ? [[key, value]] : [];
  }));
}
export function catalogHref(path: string, filters: CatalogFilterValues) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value);
  return params.size ? `${path}?${params}` : path;
}
export function commonFilters(filters: CatalogFilterValues) {
  return Object.fromEntries(commonFilterKeys.flatMap((key) => filters[key] ? [[key, filters[key]]] : []));
}
export function compatibleCommonFilters(filters: CatalogFilterValues, available: Record<string, FilterOption[]>) {
  return Object.fromEntries(Object.entries(commonFilters(filters)).filter(([key, value]) => available[key]?.some((option) => option.value === value)));
}
export function productHref(slug: string, returnTo: string) {
  return `/catalog/product/${encodeURIComponent(slug)}?${new URLSearchParams({ returnTo })}`;
}
export function safeCatalogReturn(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > 2000) return;
  if (!/^\/catalog\/(?:meat(?:\/(?:beef|lamb))?|bird|beer|water)(?:\?[^#\\\s]*)?$/.test(value)) return;
  return value;
}
