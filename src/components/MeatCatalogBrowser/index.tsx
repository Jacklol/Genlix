"use client";

import { useId, useMemo, useState, type Ref } from "react";

import homeStyles from "@/app/home.module.css";
import { ProductCard } from "@/components/ProductCard";
import { CatalogSelect } from "@/components/CatalogSelect";
import {
  meatFilterOptions,
  type MeatCatalogFilters,
  type MeatCatalogItem,
} from "@/lib/catalog";

import styles from "./MeatCatalogBrowser.module.css";

type LocalFilters = Pick<MeatCatalogFilters, "species" | "productType" | "packaging">;

type MeatCatalogBrowserProps = {
  products: MeatCatalogItem[];
  title: string;
  subtitle?: string;
  activeCut?: { id: string; label: string } | null;
  onClearCut?: () => void;
  sectionRef?: Ref<HTMLDivElement>;
  id?: string;
};

function formatProductCount(count: number) {
  const lastTwoDigits = count % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return `${count} товаров`;
  }

  const lastDigit = count % 10;

  if (lastDigit === 1) {
    return `${count} товар`;
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return `${count} товара`;
  }

  return `${count} товаров`;
}

export function MeatCatalogBrowser({
  products,
  title,
  subtitle,
  activeCut = null,
  onClearCut,
  sectionRef,
  id,
}: MeatCatalogBrowserProps) {
  const generatedId = useId().replaceAll(":", "");
  const titleId = id ? `${id}-title` : `meat-catalog-${generatedId}-title`;
  const speciesId = `meat-species-${generatedId}`;
  const productTypeId = `meat-product-type-${generatedId}`;
  const packagingId = `meat-packaging-${generatedId}`;

  const [filters, setFilters] = useState<LocalFilters>({});

  const availableOptions = useMemo(
    () => ({
      species: meatFilterOptions.species.filter((option) =>
        products.some((product) => product.meat.species === option.value),
      ),
      productTypes: meatFilterOptions.productTypes.filter((option) =>
        products.some((product) => product.meat.productType === option.value),
      ),
      packaging: meatFilterOptions.packaging.filter((option) =>
        products.some((product) => product.meat.packaging === option.value),
      ),
    }),
    [products],
  );

  const filteredProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          (!filters.species || product.meat.species === filters.species) &&
          (!filters.productType || product.meat.productType === filters.productType) &&
          (!filters.packaging || product.meat.packaging === filters.packaging) &&
          (!activeCut || product.meat.cutIds.includes(activeCut.id)),
      ),
    [activeCut, filters, products],
  );

  const hasLocalFilters = Boolean(filters.species || filters.productType || filters.packaging);
  const hasAnyFilters = hasLocalFilters || Boolean(activeCut);

  const resetFilters = () => {
    setFilters({});
    onClearCut?.();
  };

  return (
    <div
      aria-labelledby={titleId}
      className={styles.section}
      id={id}
      ref={sectionRef}
      role="region"
    >
      <div className={homeStyles.shell}>
        <header className={styles.header}>
          <div className={styles.headingCopy}>
            <p className={styles.eyebrow}>Ассортимент</p>
            <h2 className={styles.title} id={titleId}>
              {title}
            </h2>
            {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
          </div>

          <p aria-live="polite" className={styles.resultCount}>
            Найдено: <strong>{formatProductCount(filteredProducts.length)}</strong>
          </p>
        </header>

        <div aria-label="Фильтры каталога мяса" className={styles.filterPanel} role="group">
          <div className={styles.filterFields}>
            <label className={styles.field} htmlFor={speciesId}>
              <span>Вид мяса</span>
              <CatalogSelect
                id={speciesId}
                label="Вид мяса"
                options={availableOptions.species}
                emptyLabel="Все виды"
                value={filters.species ?? ""}
                onChange={(value) => {
                  setFilters((current) => ({
                    ...current,
                    species: value
                      ? (value as NonNullable<MeatCatalogFilters["species"]>)
                      : undefined,
                  }));
                }}
              />
            </label>

            <label className={styles.field} htmlFor={productTypeId}>
              <span>Тип продукта</span>
              <CatalogSelect
                id={productTypeId}
                label="Тип продукта"
                options={availableOptions.productTypes}
                emptyLabel="Все типы"
                value={filters.productType ?? ""}
                onChange={(value) => {
                  setFilters((current) => ({
                    ...current,
                    productType: value
                      ? (value as NonNullable<MeatCatalogFilters["productType"]>)
                      : undefined,
                  }));
                }}
              />
            </label>

            <label className={styles.field} htmlFor={packagingId}>
              <span>Фасовка</span>
              <CatalogSelect
                id={packagingId}
                label="Фасовка"
                options={availableOptions.packaging}
                emptyLabel="Любая фасовка"
                value={filters.packaging ?? ""}
                onChange={(value) => {
                  setFilters((current) => ({
                    ...current,
                    packaging: value
                      ? (value as NonNullable<MeatCatalogFilters["packaging"]>)
                      : undefined,
                  }));
                }}
              />
            </label>
          </div>

          <div className={styles.filterFooter}>
            <div aria-live="polite" className={styles.activeFilters}>
              {activeCut ? (
                <span className={styles.cutChip}>
                  <span>Отруб: {activeCut.label}</span>
                  {onClearCut ? (
                    <button
                      aria-label={`Убрать фильтр по отрубу «${activeCut.label}»`}
                      className={styles.chipRemove}
                      type="button"
                      onClick={onClearCut}
                    >
                      ×
                    </button>
                  ) : null}
                </span>
              ) : (
                <span className={styles.filterHint}>Можно выбрать один или несколько параметров</span>
              )}
            </div>

            <button
              className={styles.resetButton}
              disabled={!hasAnyFilters}
              type="button"
              onClick={resetFilters}
            >
              Сбросить фильтры
            </button>
          </div>
        </div>

        {filteredProducts.length > 0 ? (
          <div className={styles.grid}>
            {filteredProducts.map((product) => (
              <ProductCard key={product.slug} {...product} />
            ))}
          </div>
        ) : (
          <div className={styles.emptyState} role="status">
            <h3>Товары не найдены</h3>
            <p>Попробуйте изменить параметры или сбросить фильтры.</p>
            {hasAnyFilters ? (
              <button className={styles.emptyReset} type="button" onClick={resetFilters}>
                Показать весь ассортимент
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
