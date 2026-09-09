import { getPublishedCategoryItems } from "@/lib/cms/repository";
import { parseCategoryFilters, type CatalogQuery } from "@/lib/catalog/filter-engine";
import type { FilteredCategory } from "@/lib/catalog/category-fields";
import { CategoryCatalog } from ".";

export async function CategoryCatalogSection({ category, searchParams }: {
  category: FilteredCategory; searchParams: Promise<CatalogQuery>;
}) {
  const [products, query] = await Promise.all([getPublishedCategoryItems(category), searchParams]);
  const filters = parseCategoryFilters(category, query, products);
  return <CategoryCatalog key={`${category}:${JSON.stringify(filters)}`} category={category} products={products} initialFilters={filters} />;
}
