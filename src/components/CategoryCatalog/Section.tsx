import type { ReactNode } from "react";
import { getCatalogCommonOptions, getPublishedCategoryItems } from "@/lib/cms/repository";
import { parseCategoryFilters, type CatalogQuery } from "@/lib/catalog/filter-engine";
import type { FilteredCategory } from "@/lib/catalog/category-fields";
import { CategoryCatalog } from ".";

export async function CategoryCatalogSection({ category, searchParams, hero, heroClassName, heroTitleId }: {
  category: FilteredCategory; searchParams: Promise<CatalogQuery>;
  hero: ReactNode; heroClassName: string; heroTitleId: string;
}) {
  const [products, query, categoryOptions] = await Promise.all([getPublishedCategoryItems(category), searchParams, getCatalogCommonOptions()]);
  const filters = parseCategoryFilters(category, query, products);
  return <CategoryCatalog key={`${category}:${JSON.stringify(filters)}`} category={category} products={products} initialFilters={filters}
    categoryOptions={categoryOptions}
    hero={hero} heroClassName={heroClassName} heroTitleId={heroTitleId} />;
}
