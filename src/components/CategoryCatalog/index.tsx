"use client";

import { useId, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { CatalogSelect } from "@/components/CatalogSelect";
import { categoryFields, categoryLabels, type FilteredCategory } from "@/lib/catalog/category-fields";
import { availableFilterOptions, catalogHref, filterCategoryProducts, filterLabel, productHref, type CatalogFilterValues, type CategoryCatalogItem } from "@/lib/catalog/filter-engine";
import homeStyles from "@/app/home.module.css";
import gridStyles from "@/components/ProductCardsSection/ProductCardsSection.module.css";
import styles from "./CategoryCatalog.module.css";

export function CategoryCatalog({ category, products, initialFilters }: {
  category: FilteredCategory; products: CategoryCatalogItem[]; initialFilters: CatalogFilterValues;
}) {
  const router = useRouter();
  const id = useId();
  const [draft, setDraft] = useState(initialFilters);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const filters = initialFilters;
  const filtered = filterCategoryProducts(products, filters);
  const previewCount = filterCategoryProducts(products, draft).length;
  const fields = [
    { filter: "manufacturer", label: "Производитель", primary: true },
    ...categoryFields[category].filter((field) => field.filter),
  ];
  const primary = fields.filter((field) => field.primary);
  const extra = fields.filter((field) => !field.primary);
  const entries = Object.entries(filters).filter((entry): entry is [string, string] => Boolean(entry[1]));
  const path = `/catalog/${category}`;
  const returnTo = catalogHref(path, filters);

  function apply(next: CatalogFilterValues) {
    setDraft(next);
    setMobileOpen(false);
    startTransition(() => router.push(catalogHref(path, next), { scroll: false }));
  }
  function submit(event: FormEvent) { event.preventDefault(); apply(draft); }
  function fieldControl(field: typeof fields[number]) {
    const key = field.filter!;
    const options = availableFilterOptions(products, key);
    return <label key={key} className={styles.field}>
      <span>{field.label}</span>
      <CatalogSelect label={field.label} value={draft[key]} options={options}
        emptyLabel={options.length ? "Все" : "Пока не указано"} disabled={!options.length || pending}
        onChange={(value) => setDraft((current) => ({ ...current, [key]: value || undefined }))} />
    </label>;
  }
  return <>
    <section className={styles.filters} aria-label={`Фильтры: ${categoryLabels[category]}`}>
      <div className={homeStyles.shell}>
        <button className={styles.mobileToggle} aria-expanded={mobileOpen} aria-controls={`${id}-filters`}
          onClick={() => setMobileOpen(!mobileOpen)} type="button">Фильтры{entries.length ? ` · ${entries.length}` : ""} <span aria-hidden="true">{mobileOpen ? "−" : "+"}</span></button>
        <form id={`${id}-filters`} onSubmit={submit} className={`${styles.form} ${mobileOpen ? styles.open : ""}`}>
          <div className={styles.primary}>{primary.map(fieldControl)}</div>
          <details className={styles.more}>
            <summary>Ещё фильтры{extra.some((field) => filters[field.filter!]) ? " · выбраны" : ""}</summary>
            <div className={styles.extra}>{extra.map(fieldControl)}</div>
          </details>
          <div className={styles.actions}>
            <button className={styles.apply} disabled={pending} type="submit">{pending ? "Применяем…" : `Применить · ${previewCount}`}</button>
            <button className={styles.reset} disabled={pending || !Object.values(draft).some(Boolean) && !entries.length} type="button" onClick={() => apply({})}>Сбросить</button>
          </div>
        </form>
        {entries.length ? <div className={styles.chips} aria-label="Выбранные фильтры">
          {entries.map(([key, value]) => <button key={key} type="button" disabled={pending}
            aria-label={`Убрать фильтр: ${filterLabel(key, value)}`} onClick={() => { const next = { ...filters }; delete next[key]; apply(next); }}>
            {filterLabel(key, value)} <span aria-hidden="true">×</span>
          </button>)}
        </div> : null}
      </div>
    </section>
    <section className={styles.results} aria-labelledby={`${id}-title`} aria-busy={pending}>
      <div className={homeStyles.shell}>
        <div className={styles.resultsHeading}><h2 id={`${id}-title`} className={gridStyles.title}>{categoryLabels[category]}</h2>
          <p role="status" aria-live="polite">Найдено: {filtered.length} из {products.length}</p></div>
        {filtered.length ? <div className={gridStyles.grid}>
          {filtered.map((product) => <ProductCard key={product.slug} {...product} href={productHref(product.slug, returnTo)} />)}
        </div> : <div className={styles.empty}>
          <h3>{products.length ? "По этим фильтрам товаров не найдено" : "Ассортимент скоро появится"}</h3>
          <p>{products.length ? "Попробуйте убрать часть условий или сбросить фильтры." : "Пока здесь нет опубликованных товаров. Уточните доступные поставки у менеджера."}</p>
          {entries.length ? <button className={styles.apply} onClick={() => apply({})}>Сбросить фильтры</button> : <Link href="/#contacts">Связаться с нами →</Link>}
        </div>}
      </div>
    </section>
  </>;
}
