import { Suspense } from "react";
import type { CatalogCategory } from "@/lib/catalog/category-fields";
import { getCatalogCommonOptions } from "@/lib/cms/repository";
import { CatalogCategoryLinks } from "./CatalogCategoryLinks";

export async function CatalogCategoryNav({ activeCategory }: { activeCategory: CatalogCategory }) {
  const options = await getCatalogCommonOptions();
  return <Suspense><CatalogCategoryLinks activeCategory={activeCategory} options={options} /></Suspense>;
}
