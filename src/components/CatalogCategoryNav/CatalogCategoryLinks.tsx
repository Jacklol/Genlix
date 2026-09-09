"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { categoryLabels, type CatalogCategory } from "@/lib/catalog/category-fields";
import { catalogHref, compatibleCommonFilters, type FilterOption } from "@/lib/catalog/filter-engine";
import homeStyles from "@/app/home.module.css";
import styles from "./CatalogCategoryNav.module.css";

export function CatalogCategoryLinks({ activeCategory, options }: {
  activeCategory: CatalogCategory;
  options: Record<CatalogCategory, Record<string, FilterOption[]>>;
}) {
  const search = useSearchParams();
  const filters = Object.fromEntries(search.entries());
  return <div className={styles.bar}><div className={homeStyles.shell}>
    <nav aria-label="Разделы каталога"><ul className={styles.list}>
      {(Object.keys(categoryLabels) as CatalogCategory[]).map((category) => <li key={category}>
        <Link aria-current={category === activeCategory ? "page" : undefined}
          className={category === activeCategory ? styles.active : undefined}
          href={catalogHref(`/catalog/${category}`, compatibleCommonFilters(filters, options[category]))}>
          {categoryLabels[category]}
        </Link>
      </li>)}
    </ul></nav>
  </div></div>;
}
