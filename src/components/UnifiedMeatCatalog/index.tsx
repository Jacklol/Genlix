"use client";

import {
  useId,
  useMemo,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
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

type CatalogFilterKey = keyof CatalogFilters;

type UnifiedMeatCatalogProps = {
  products: MeatCatalogItem[];
  initialFilters?: CatalogFilters;
  speciesPage?: DedicatedSpecies;
};

const countryLabels: Record<string, string> = {
  argentina: "Аргентина",
  belarus: "Беларусь",
  brazil: "Бразилия",
  russia: "Россия",
  uruguay: "Уругвай",
};

function isDedicatedSpecies(species?: MeatSpecies): species is DedicatedSpecies {
  return species === "beef" || species === "lamb";
}

function subscribeToMobileViewport(callback: () => void) {
  const media = window.matchMedia("(max-width: 600px)");

  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function getMobileViewportSnapshot() {
  return window.matchMedia("(max-width: 600px)").matches;
}

function getServerMobileViewportSnapshot() {
  return false;
}

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

function filterCatalogProducts(products: MeatCatalogItem[], filters: CatalogFilters) {
  return products.filter(
    (product) =>
      (!filters.species || product.meat.species === filters.species) &&
      (!filters.manufacturer || product.brand === filters.manufacturer) &&
      (!filters.country || product.meat.country === filters.country) &&
      (!filters.packaging || product.meat.packaging === filters.packaging) &&
      (!filters.channel || product.meat.channel === filters.channel),
  );
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
  const isMobileViewport = useSyncExternalStore(
    subscribeToMobileViewport,
    getMobileViewportSnapshot,
    getServerMobileViewportSnapshot,
  );
  const [disclosureOverride, setDisclosureOverride] = useState<boolean | null>(null);
  const filtersOpen = isMobileViewport ? (disclosureOverride ?? false) : true;
  const availableProducts = useMemo(
    () =>
      speciesPage
        ? products.filter((product) => product.meat.species === speciesPage)
        : products,
    [products, speciesPage],
  );
  const speciesOptions = useMemo(
    () =>
      meatFilterOptions.species.filter((option) =>
        products.some((product) => product.meat.species === option.value),
      ),
    [products],
  );
  const manufacturerOptions = useMemo(
    () =>
      Array.from(
        new Set(
          availableProducts
            .map((product) => product.brand)
            .filter((brand): brand is string => Boolean(brand)),
        ),
      )
        .sort((left, right) => left.localeCompare(right, "ru"))
        .map((value) => ({ label: value, value })),
    [availableProducts],
  );
  const countryOptions = useMemo(() => {
    return Array.from(new Set(availableProducts.map((product) => product.meat.country)))
      .sort((left, right) =>
        (countryLabels[left] ?? left).localeCompare(countryLabels[right] ?? right, "ru"),
      )
      .map((value) => ({ label: countryLabels[value] ?? value, value }));
  }, [availableProducts]);
  const packagingOptions = useMemo(
    () =>
      meatFilterOptions.packaging.filter((option) =>
        availableProducts.some((product) => product.meat.packaging === option.value),
      ),
    [availableProducts],
  );
  const channelOptions = useMemo(
    () =>
      meatFilterOptions.channels.filter((option) =>
        availableProducts.some((product) => product.meat.channel === option.value),
      ),
    [availableProducts],
  );

  const filteredProducts = useMemo(
    () => filterCatalogProducts(products, appliedFilters),
    [appliedFilters, products],
  );
  const previewProductCount = useMemo(
    () => filterCatalogProducts(products, draftFilters).length,
    [draftFilters, products],
  );

  const hasAppliedFilters = Object.values(appliedFilters).some(Boolean);
  const activeFilterCount = Object.values(appliedFilters).filter(Boolean).length;

  const getFilterLabel = (key: CatalogFilterKey, value: string) => {
    if (key === "manufacturer") {
      return value;
    }

    if (key === "country") {
      return countryLabels[value] ?? value;
    }

    const optionGroups = {
      channel: meatFilterOptions.channels,
      packaging: meatFilterOptions.packaging,
      species: meatFilterOptions.species,
    } as const;

    return optionGroups[key].find((option) => option.value === value)?.label ?? value;
  };

  const activeFilters = (
    Object.entries(appliedFilters) as [CatalogFilterKey, string | undefined][]
  ).flatMap(([key, value]) =>
    value ? [{ key, label: getFilterLabel(key, value) }] : [],
  );

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (draftFilters.species === "poultry") {
      router.push("/catalog/bird");
      return;
    }

    const dedicatedSpecies = isDedicatedSpecies(draftFilters.species)
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
    if (isMobileViewport) {
      setDisclosureOverride(false);
    }
    router.replace(
      buildCatalogHref(
        speciesPage ? `/catalog/meat/${speciesPage}` : "/catalog/meat",
        draftFilters,
        !speciesPage,
      ),
      { scroll: false },
    );
  };

  const removeFilter = (key: CatalogFilterKey) => {
    const nextFilters = { ...appliedFilters };
    delete nextFilters[key];

    setDraftFilters(nextFilters);
    setAppliedFilters(nextFilters);

    if (key === "species" && speciesPage) {
      router.push(buildCatalogHref("/catalog/meat", nextFilters, true));
      return;
    }

    router.replace(
      buildCatalogHref(
        speciesPage ? `/catalog/meat/${speciesPage}` : "/catalog/meat",
        nextFilters,
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

          <details
            className={styles.filterDisclosure}
            onToggle={(event) => {
              if (event.nativeEvent.isTrusted) {
                setDisclosureOverride(event.currentTarget.open);
              }
            }}
            open={filtersOpen}
          >
            <summary className={styles.filterSummary}>
              <span>
                <strong>Фильтры</strong>
                <small>
                  {activeFilterCount > 0
                    ? `Выбрано: ${activeFilterCount}`
                    : "Выбрать параметры"}
                </small>
              </span>
              <svg aria-hidden="true" viewBox="0 0 16 16">
                <path d="m3 6 5 5 5-5" />
              </svg>
            </summary>

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
                  {speciesOptions.map((option) => (
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
                  {packagingOptions.map((option) => (
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
                  {channelOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              </div>

              {activeFilters.length > 0 ? (
                <div className={styles.activeFilters} aria-label="Активные фильтры">
                  <span className={styles.activeFiltersLabel}>Выбрано</span>
                  <div className={styles.chips}>
                    {activeFilters.map((filter) => (
                      <button
                        aria-label={`Удалить фильтр «${filter.label}»`}
                        className={styles.chip}
                        key={filter.key}
                        onClick={() => removeFilter(filter.key)}
                        type="button"
                      >
                        <span>{filter.label}</span>
                        <svg aria-hidden="true" viewBox="0 0 12 12">
                          <path d="m2.2 2.2 7.6 7.6m0-7.6-7.6 7.6" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className={styles.filterActions}>
                <button className={styles.resetButton} type="button" onClick={resetFilters}>
                  Сбросить
                </button>
                <button className={styles.applyButton} type="submit">
                  <span>Применить фильтры</span>
                  <small aria-live="polite">
                    {draftFilters.species === "poultry"
                      ? "Открыть раздел «Птица»"
                      : `Показать ${formatProductCount(previewProductCount)}`}
                  </small>
                </button>
              </div>
            </form>
          </details>
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
