"use client";

import { useId, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import homeStyles from "@/app/home.module.css";
import { ProductCard } from "@/components/ProductCard";
import {
  meatFilterOptions,
  type MeatCatalogFilters,
  type MeatCatalogItem,
  type MeatCountry,
  type MeatManufacturer,
  type MeatPackaging,
  type MeatSalesChannel,
  type MeatSpecies,
} from "@/lib/catalog";

import styles from "./UnifiedMeatCatalog.module.css";

type CatalogFilters = Pick<
  MeatCatalogFilters,
  "species" | "manufacturer" | "country" | "packaging" | "channel"
>;

type DedicatedSpecies = Extract<MeatSpecies, "beef" | "lamb">;

type UnifiedMeatCatalogProps = {
  products: MeatCatalogItem[];
  initialFilters?: CatalogFilters;
  speciesPage?: DedicatedSpecies;
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

function buildCatalogHref(pathname: string, filters: CatalogFilters, includeSpecies: boolean) {
  const searchParams = new URLSearchParams();

  if (includeSpecies && filters.species) {
    searchParams.set("species", filters.species);
  }

  if (filters.manufacturer) {
    searchParams.set("manufacturer", filters.manufacturer);
  }

  if (filters.country) {
    searchParams.set("country", filters.country);
  }

  if (filters.packaging) {
    searchParams.set("packaging", filters.packaging);
  }

  if (filters.channel) {
    searchParams.set("channel", filters.channel);
  }

  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function UnifiedMeatCatalog({
  products,
  initialFilters = {},
  speciesPage,
}: UnifiedMeatCatalogProps) {
  const router = useRouter();
  const generatedId = useId().replaceAll(":", "");
  const speciesId = `catalog-species-${generatedId}`;
  const manufacturerId = `catalog-manufacturer-${generatedId}`;
  const countryId = `catalog-country-${generatedId}`;
  const packagingId = `catalog-packaging-${generatedId}`;
  const channelId = `catalog-channel-${generatedId}`;

  const normalizedInitialFilters: CatalogFilters = {
    ...initialFilters,
    ...(speciesPage ? { species: speciesPage } : {}),
  };

  const [draftFilters, setDraftFilters] = useState<CatalogFilters>(normalizedInitialFilters);
  const [appliedFilters, setAppliedFilters] = useState<CatalogFilters>(normalizedInitialFilters);
  const manufacturerOptions = useMemo(
    () =>
      Array.from(
        new Set(
          products
            .map((product) => product.brand)
            .filter((brand): brand is string => Boolean(brand)),
        ),
      )
        .sort((left, right) => left.localeCompare(right, "ru"))
        .map((value) => ({ label: value, value })),
    [products],
  );
  const countryOptions = useMemo(() => {
    const labels: Record<string, string> = {
      argentina: "Аргентина",
      belarus: "Беларусь",
      brazil: "Бразилия",
      russia: "Россия",
      uruguay: "Уругвай",
    };

    return Array.from(new Set(products.map((product) => product.meat.country)))
      .sort((left, right) => (labels[left] ?? left).localeCompare(labels[right] ?? right, "ru"))
      .map((value) => ({ label: labels[value] ?? value, value }));
  }, [products]);

  const filteredProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          (!appliedFilters.species || product.meat.species === appliedFilters.species) &&
          (!appliedFilters.manufacturer || product.brand === appliedFilters.manufacturer) &&
          (!appliedFilters.country || product.meat.country === appliedFilters.country) &&
          (!appliedFilters.packaging || product.meat.packaging === appliedFilters.packaging) &&
          (!appliedFilters.channel || product.meat.channel === appliedFilters.channel),
      ),
    [appliedFilters, products],
  );

  const hasAppliedFilters = Object.values(appliedFilters).some(Boolean);

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const dedicatedSpecies =
      draftFilters.species === "beef" || draftFilters.species === "lamb"
        ? draftFilters.species
        : undefined;

    if (dedicatedSpecies && dedicatedSpecies !== speciesPage) {
      router.push(
        buildCatalogHref(`/catalog/meat/${dedicatedSpecies}`, draftFilters, false),
      );
      return;
    }

    if (!dedicatedSpecies && speciesPage) {
      router.push(buildCatalogHref("/catalog/meat", draftFilters, true));
      return;
    }

    setAppliedFilters({ ...draftFilters });
    router.replace(
      buildCatalogHref(
        speciesPage ? `/catalog/meat/${speciesPage}` : "/catalog/meat",
        draftFilters,
        !speciesPage,
      ),
      { scroll: false },
    );
  };

  const resetFilters = () => {
    const resetState: CatalogFilters = speciesPage ? { species: speciesPage } : {};

    setDraftFilters(resetState);
    setAppliedFilters(resetState);

    if (hasAppliedFilters) {
      router.replace(speciesPage ? `/catalog/meat/${speciesPage}` : "/catalog/meat", {
        scroll: false,
      });
    }
  };

  const showAllProducts = () => {
    setDraftFilters({});
    setAppliedFilters({});
    router.push("/catalog/meat");
  };

  return (
    <>
      <section className={styles.filtersSection} aria-labelledby="meat-filter-title">
        <div className={homeStyles.shell}>
          <header className={styles.filterHeader}>
            <p className={styles.eyebrow}>Подбор продукции</p>
            <h2 id="meat-filter-title">Найдите подходящий товар</h2>
            <p>
              Выберите параметры поставки, затем нажмите кнопку «Применить фильтры».
            </p>
          </header>

          <form className={styles.filterPanel} onSubmit={applyFilters}>
            <div className={styles.filterFields}>
              <label className={styles.field} htmlFor={speciesId}>
                <span>Вид мяса</span>
                <select
                  id={speciesId}
                  value={draftFilters.species ?? ""}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      species: event.target.value
                        ? (event.target.value as MeatSpecies)
                        : undefined,
                    }))
                  }
                >
                  <option value="">Все виды мяса</option>
                  {meatFilterOptions.species.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.field} htmlFor={manufacturerId}>
                <span>Производитель</span>
                <select
                  id={manufacturerId}
                  value={draftFilters.manufacturer ?? ""}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      manufacturer: event.target.value
                        ? (event.target.value as MeatManufacturer)
                        : undefined,
                    }))
                  }
                >
                  <option value="">Все производители</option>
                  {manufacturerOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.field} htmlFor={countryId}>
                <span>Страна</span>
                <select
                  id={countryId}
                  value={draftFilters.country ?? ""}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      country: event.target.value
                        ? (event.target.value as MeatCountry)
                        : undefined,
                    }))
                  }
                >
                  <option value="">Все страны</option>
                  {countryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.field} htmlFor={packagingId}>
                <span>Упаковка</span>
                <select
                  id={packagingId}
                  value={draftFilters.packaging ?? ""}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      packaging: event.target.value
                        ? (event.target.value as MeatPackaging)
                        : undefined,
                    }))
                  }
                >
                  <option value="">Любая упаковка</option>
                  {meatFilterOptions.packaging.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.field} htmlFor={channelId}>
                <span>Формат поставки</span>
                <select
                  id={channelId}
                  value={draftFilters.channel ?? ""}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      channel: event.target.value
                        ? (event.target.value as MeatSalesChannel)
                        : undefined,
                    }))
                  }
                >
                  <option value="">HoReCa и ритейл</option>
                  {meatFilterOptions.channels.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className={styles.filterActions}>
              <button className={styles.resetButton} type="button" onClick={resetFilters}>
                Сбросить
              </button>
              <button className={styles.applyButton} type="submit">
                Применить фильтры
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className={styles.catalogSection} aria-labelledby="meat-products-title">
        <div className={homeStyles.shell}>
          <header className={styles.catalogHeader}>
            <div>
              <p className={styles.eyebrow}>Ассортимент</p>
              <h2 id="meat-products-title">Каталог наших товаров</h2>
            </div>
            <p aria-live="polite" className={styles.resultCount}>
              Найдено: <strong>{formatProductCount(filteredProducts.length)}</strong>
            </p>
          </header>

          {filteredProducts.length > 0 ? (
            <div className={styles.grid}>
              {filteredProducts.map((product) => (
                <ProductCard key={product.slug} {...product} />
              ))}
            </div>
          ) : (
            <div className={styles.emptyState} role="status">
              <h3>Товары пока не найдены</h3>
              <p>
                Ассортимент с выбранными параметрами ещё не добавлен. Попробуйте изменить
                фильтры или показать весь каталог.
              </p>
              <button type="button" onClick={showAllProducts}>
                Показать весь каталог
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
