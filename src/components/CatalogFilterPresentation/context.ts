"use client";

import { createContext, useContext } from "react";
import type { CatalogCategory } from "@/lib/catalog/category-fields";

export const CatalogFilterPresentationContext = createContext<{
  selectedCategory: CatalogCategory | null;
  selectCategory: (category: CatalogCategory) => void;
} | null>(null);

export function useCatalogFilterPresentation() {
  return useContext(CatalogFilterPresentationContext);
}
