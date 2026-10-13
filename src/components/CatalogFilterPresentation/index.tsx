"use client";

import { useMemo, useSyncExternalStore, type ReactNode } from "react";
import { categoryLabels, type CatalogCategory } from "@/lib/catalog/category-fields";
import { CatalogFilterPresentationContext } from "./context";
import styles from "./CatalogFilterPresentation.module.css";

const categoryKey = "genlix:catalog-selected-category";
const listeners = new Set<() => void>();
let memoryCategory: CatalogCategory | null = null;

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function getSelectedCategory(): CatalogCategory | null {
  try {
    const saved = window.sessionStorage.getItem(categoryKey);
    if (saved && Object.hasOwn(categoryLabels, saved)) return saved as CatalogCategory;
  } catch { /* Keep the explicit choice for this page in memory. */ }
  return memoryCategory;
}

function selectCategory(category: CatalogCategory) {
  memoryCategory = category;
  try { window.sessionStorage.setItem(categoryKey, category); } catch { /* Use memory instead. */ }
  listeners.forEach(listener => listener());
}

function getServerSelectedCategory() { return null; }

export function CatalogFilterPresentation({ children }: { children: ReactNode }) {
  const selectedCategory = useSyncExternalStore(subscribe, getSelectedCategory, getServerSelectedCategory);
  const context = useMemo(() => ({ selectedCategory, selectCategory }), [selectedCategory]);

  return <CatalogFilterPresentationContext.Provider value={context}>
    <div className={styles.presentation} data-filter-appearance="glass">
      {children}
    </div>
  </CatalogFilterPresentationContext.Provider>;
}
