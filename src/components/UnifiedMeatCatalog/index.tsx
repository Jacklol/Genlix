"use client";

import {
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import homeStyles from "@/app/home.module.css";
import { ProductCard } from "@/components/ProductCard";
import { CatalogSelect } from "@/components/CatalogSelect";
import { MeatCutsMap } from "@/components/MeatCutsMap";
import { meatCutRegions } from "@/lib/meat-cuts";
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
import { catalogHref, commonFilters, matchesChannel, matchesFilter, productHref } from "@/lib/catalog/filter-engine";

type CatalogFilters = Pick<
  MeatCatalogFilters,
  "species" | "manufacturer" | "country" | "packaging" | "channel" | "cutId"
>;

type DedicatedSpecies = Extract<MeatSpecies, "beef" | "lamb">;

type CatalogFilterKey = keyof CatalogFilters;

type UnifiedMeatCatalogProps = {
  hero: ReactNode;
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

  if (filters.species === "beef" && filters.cutId) {
    searchParams.set("cutId", filters.cutId);
  }

  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function filterCatalogProducts(products: MeatCatalogItem[], filters: CatalogFilters) {
  return products.filter(
    (product) =>
      matchesFilter(product.meat.species, filters.species) &&
      matchesFilter(product.brand, filters.manufacturer) &&
      matchesFilter(product.meat.country, filters.country) &&
      matchesFilter(product.meat.packaging, filters.packaging) &&
      matchesChannel(product.meat.channel, filters.channel) &&
      matchesFilter(product.meat.cutIds, filters.cutId),
  );
}

export function UnifiedMeatCatalog({
  hero,
  products,
  initialFilters = {},
  speciesPage,
}: UnifiedMeatCatalogProps) {
  const router = useRouter();
  const resultsRef = useRef<HTMLElement>(null);
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
        availableProducts.some((product) => matchesChannel(product.meat.channel, option.value)),
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
  const selectedCut = meatCutRegions.find((region) => region.id === appliedFilters.cutId);

  const getFilterLabel = (key: CatalogFilterKey, value: string) => {
    if (key === "cutId") {
      return meatCutRegions.find((region) => region.id === value)?.titleRu ?? value;
    }

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
      router.push(catalogHref("/catalog/bird", commonFilters(draftFilters)));
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

    if (key === "species") {
      delete nextFilters.cutId;
    }

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

  const selectCut = (cutId?: string) => {
    if (speciesPage !== "beef") return;

    const nextFilters: CatalogFilters = { ...appliedFilters, cutId };
    setDraftFilters(nextFilters);
    setAppliedFilters(nextFilters);
    router.replace(buildCatalogHref("/catalog/meat/beef", nextFilters, false), {
      scroll: false,
    });

    window.requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
        block: "start",
      });
    });
  };

  return (
    <>
      {speciesPage === "beef" ? (
        <div>
          {hero}
          <MeatCutsMap
            mode="filter"
            selectedCutId={appliedFilters.cutId ?? null}
            subtitle="Нажмите на часть туши — подходящие товары появятся ниже"
            onCutSelect={(region) => selectCut(region.id)}
            onClearSelection={() => selectCut()}
          />
        </div>
      ) : hero}

      <section className={styles.filtersSection} aria-label="Фильтры каталога мяса">
        <div className={homeStyles.shell}>
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
                <CatalogSelect
                  id={speciesId}
                  label="Вид мяса"
                  options={speciesOptions}
                  emptyLabel="Все виды мяса"
                  value={draftFilters.species ?? ""}
                  onChange={(value) =>
                    setDraftFilters((current) => ({
                      ...current,
                      species: value
                        ? (value as MeatSpecies)
                        : undefined,
                      cutId: value === "beef" ? current.cutId : undefined,
                    }))
                  }
                />
              </label>

              <label className={styles.field} htmlFor={manufacturerId}>
                <span>Производитель</span>
                <CatalogSelect
                  id={manufacturerId}
                  label="Производитель"
                  options={manufacturerOptions}
                  emptyLabel="Все производители"
                  value={draftFilters.manufacturer ?? ""}
                  onChange={(value) =>
                    setDraftFilters((current) => ({
                      ...current,
                      manufacturer: value
                        ? (value as MeatManufacturer)
                        : undefined,
                    }))
                  }
                />
              </label>

              <label className={styles.field} htmlFor={countryId}>
                <span>Страна</span>
                <CatalogSelect
                  id={countryId}
                  label="Страна"
                  options={countryOptions}
                  emptyLabel="Все страны"
                  value={draftFilters.country ?? ""}
                  onChange={(value) =>
                    setDraftFilters((current) => ({
                      ...current,
                      country: value
                        ? (value as MeatCountry)
                        : undefined,
                    }))
                  }
                />
              </label>

              <label className={styles.field} htmlFor={packagingId}>
                <span>Упаковка</span>
                <CatalogSelect
                  id={packagingId}
                  label="Упаковка"
                  options={packagingOptions}
                  emptyLabel="Любая упаковка"
                  value={draftFilters.packaging ?? ""}
                  onChange={(value) =>
                    setDraftFilters((current) => ({
                      ...current,
                      packaging: value
                        ? (value as MeatPackaging)
                        : undefined,
                    }))
                  }
                />
              </label>

              <label className={styles.field} htmlFor={channelId}>
                <span>Формат поставки</span>
                <CatalogSelect
                  id={channelId}
                  label="Формат поставки"
                  options={channelOptions}
                  emptyLabel="HoReCa и ритейл"
                  value={draftFilters.channel ?? ""}
                  onChange={(value) =>
                    setDraftFilters((current) => ({
                      ...current,
                      channel: value
                        ? (value as MeatSalesChannel)
                        : undefined,
                    }))
                  }
                />
              </label>
              </div>

              <div className={styles.filterActions}>
                <button
                  aria-label={
                    draftFilters.species === "poultry"
                      ? "Применить фильтры — открыть раздел «Птица»"
                      : `Применить фильтры — показать ${formatProductCount(previewProductCount)}`
                  }
                  className={styles.applyButton}
                  type="submit"
                >
                  <span>Применить</span>
                  <small aria-hidden="true">
                    {draftFilters.species === "poultry" ? "→" : previewProductCount}
                  </small>
                </button>
                <button className={styles.resetButton} type="button" onClick={resetFilters}>
                  Сбросить
                </button>
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

            </form>
          </details>
        </div>
      </section>

      <section
        className={styles.catalogSection}
        aria-labelledby="meat-products-title"
        ref={resultsRef}
        id="meat-products"
      >
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

          {selectedCut ? (
            <div className={styles.cutSummary}>
              <p>Выбран отруб: <strong>{selectedCut.titleRu}</strong></p>
              <button type="button" className={styles.resetButton} onClick={() => selectCut()}>
                Все отрубы
              </button>
            </div>
          ) : null}

          {filteredProducts.length > 0 ? (
            <div className={styles.grid}>
              {filteredProducts.map((product) => (
                <ProductCard key={product.slug} {...product} href={productHref(product.slug, buildCatalogHref(
                  speciesPage ? `/catalog/meat/${speciesPage}` : "/catalog/meat", appliedFilters, !speciesPage,
                ))} />
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
