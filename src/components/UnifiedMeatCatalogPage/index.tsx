import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SubscribeSection } from "@/components/SubscribeSection";
import { UnifiedMeatCatalog } from "@/components/UnifiedMeatCatalog";
import {
  type MeatCatalogFilters,
  type MeatSpecies,
} from "@/lib/catalog";
import { getCatalogCommonOptions, getPublishedMeatItems } from "@/lib/cms/repository";
import { findCatalogMeatCut } from "@/lib/catalog/meat-catalog-artwork";
import homeStyles from "@/app/home.module.css";

import styles from "./UnifiedMeatCatalogPage.module.css";
import { matchesChannel } from "@/lib/catalog/filter-engine";

type DedicatedSpecies = Extract<MeatSpecies, "beef" | "lamb">;

type UnifiedMeatCatalogPageProps = {
  initialFilters?: MeatCatalogFilters;
  speciesPage?: DedicatedSpecies;
};

function normalizeInitialFilters(
  filters: MeatCatalogFilters,
  products: Awaited<ReturnType<typeof getPublishedMeatItems>>,
  speciesPage?: DedicatedSpecies,
): MeatCatalogFilters {
  const availableSpecies = new Set(products.map((product) => product.meat.species));
  const species =
    speciesPage ??
    (filters.species && availableSpecies.has(filters.species)
      ? filters.species
      : undefined);
  const candidates = species
    ? products.filter((product) => product.meat.species === species)
    : products;
  const normalized: MeatCatalogFilters = species ? { species } : {};

  if (
    filters.manufacturer &&
    candidates.some((product) => product.brand === filters.manufacturer)
  ) {
    normalized.manufacturer = filters.manufacturer;
  }

  if (
    filters.country &&
    candidates.some((product) => product.meat.country === filters.country)
  ) {
    normalized.country = filters.country;
  }

  if (
    filters.packaging &&
    candidates.some((product) => product.meat.packaging === filters.packaging)
  ) {
    normalized.packaging = filters.packaging;
  }

  if (
    filters.channel &&
    candidates.some((product) => matchesChannel(product.meat.channel, filters.channel))
  ) {
    normalized.channel = filters.channel;
  }

  if (
    speciesPage === "beef" &&
    findCatalogMeatCut(filters.cutId)
  ) {
    normalized.cutId = filters.cutId;
  }

  return normalized;
}

const pageContent = {
  all: {
    eyebrow: "Каталог Genlix",
    title: "Мясо для бизнеса и профессиональной кухни",
    description:
      "От крупных отрубов для HoReCa до готовой упаковки для розничных сетей.",
  },
  beef: {
    eyebrow: "Вид мяса",
    title: "Говядина",
    description:
      "Стейки, отрубы и готовая продукция из говядины для HoReCa и ритейла.",
  },
  lamb: {
    eyebrow: "Вид мяса",
    title: "Баранина",
    description:
      "Каталог баранины для ресторанов, профессиональной кухни и розничных сетей.",
  },
} as const;

const speciesLabels: Record<DedicatedSpecies, string> = {
  beef: "Говядина",
  lamb: "Баранина",
};

export async function UnifiedMeatCatalogPage({
  initialFilters = {},
  speciesPage,
}: UnifiedMeatCatalogPageProps) {
  const [products, categoryOptions] = await Promise.all([getPublishedMeatItems(), getCatalogCommonOptions()]);

  if (
    speciesPage &&
    !products.some((product) => product.meat.species === speciesPage)
  ) {
    notFound();
  }

  const content = speciesPage ? pageContent[speciesPage] : pageContent.all;
  const bullHero = speciesPage === "beef";
  const filters = normalizeInitialFilters(initialFilters, products, speciesPage);
  const filterStateKey = [
    filters.species,
    filters.manufacturer,
    filters.country,
    filters.packaging,
    filters.channel,
    filters.cutId,
  ].join("|");

  return (
    <main className={homeStyles.page}>
      <Header activeLink="Каталог" static />

      <Breadcrumbs
        variant={bullHero ? "dark" : "default"}
        items={[
          { label: "Главная", href: "/" },
          { label: "Каталог", href: "/#catalog" },
          ...(speciesPage
            ? [
                { label: "Мясо", href: "/catalog/meat" },
                { label: speciesLabels[speciesPage] },
              ]
            : [{ label: "Мясо" }]),
        ]}
      />

      <UnifiedMeatCatalog
        categoryOptions={categoryOptions}
        heroClassName={styles.hero}
        hero={bullHero ? (
          <header className={styles.catalogHeading}>
            <h1 id="meat-page-title">{content.title}</h1>
          </header>
        ) : (
          <div className={styles.heroContent}>
            <div className={homeStyles.shell}>
              <div className={styles.heroCopy}>
                <p>{content.eyebrow}</p>
                <h1 id="meat-page-title">{content.title}</h1>
                <span>{content.description}</span>
              </div>
            </div>
          </div>
        )}
        initialFilters={filters}
        key={filterStateKey}
        products={products}
        speciesPage={speciesPage}
      />

      <SubscribeSection />
      <Footer />
    </main>
  );
}
