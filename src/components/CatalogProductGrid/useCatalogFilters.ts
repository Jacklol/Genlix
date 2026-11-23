"use client";

import { useCallback, useMemo, useState, type SetStateAction } from "react";
import { useSearchParams } from "next/navigation";
import type { CatalogQuery } from "@/lib/catalog/filter-engine";

/** The URL remains the applied state, including browser Back/Forward. */
export function useCatalogFilters<T extends Record<string, string | undefined>>(parse: (query: CatalogQuery) => T) {
  const search = useSearchParams().toString();
  const filters = useMemo(() => {
    const params = new URLSearchParams(search);
    const query: CatalogQuery = {};
    for (const key of params.keys()) {
      const values = params.getAll(key);
      query[key] = values.length > 1 ? values : values[0];
    }
    return parse(query);
  }, [parse, search]);
  const key = JSON.stringify(filters);
  const [draftState, setDraftState] = useState({ key, value: filters });
  const draft = draftState.key === key ? draftState.value : filters;
  const setDraft = useCallback((next: SetStateAction<T>) => {
    setDraftState(current => {
      const previous = current.key === key ? current.value : filters;
      return { key, value: typeof next === "function" ? next(previous) : next };
    });
  }, [filters, key]);
  return { filters, draft, setDraft };
}
