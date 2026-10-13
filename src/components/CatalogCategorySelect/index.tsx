"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CatalogSelect } from "@/components/CatalogSelect";
import { useCatalogFilterPresentation } from "@/components/CatalogFilterPresentation/context";
import { categoryLabels, type CatalogCategory } from "@/lib/catalog/category-fields";
import { catalogHref, compatibleCommonFilters, type CatalogFilterValues, type FilterOption } from "@/lib/catalog/filter-engine";

export type CatalogCategoryOptions = Record<CatalogCategory, Record<string, FilterOption[]>>;

const categories = (Object.keys(categoryLabels) as CatalogCategory[]).map(value => ({
  value, label: categoryLabels[value],
}));

export function CatalogCategorySelect({ activeCategory, filters, options, disabled = false }: {
  activeCategory: CatalogCategory;
  filters: CatalogFilterValues;
  options: CatalogCategoryOptions;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const presentation = useCatalogFilterPresentation();

  return <CatalogSelect
    label="Вид"
    value={activeCategory}
    options={categories}
    includeEmptyOption={false}
    disabled={disabled || pending}
    variant="dark"
    chevronSrc="/assets/catalog/meat/catalog-hero/select-chevron.svg"
    showSelection={presentation?.selectedCategory === activeCategory}
    onCommit={value => {
      if (Object.hasOwn(categoryLabels, value)) presentation?.selectCategory(value as CatalogCategory);
    }}
    onChange={value => {
      if (value === activeCategory || !Object.hasOwn(categoryLabels, value)) return;
      const category = value as CatalogCategory;
      startTransition(() => router.push(catalogHref(
        `/catalog/${category}`, compatibleCommonFilters(filters, options[category]),
      )));
    }}
  />;
}
