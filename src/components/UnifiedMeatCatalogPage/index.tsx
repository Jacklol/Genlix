import { notFound } from "next/navigation";
import { preload } from "react-dom";

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
import { normalizeMeatCatalogFilters } from "@/lib/catalog/meat-filters";
import homeStyles from "@/app/home.module.css";

import styles from "./UnifiedMeatCatalogPage.module.css";

type DedicatedSpecies = Extract<MeatSpecies, "beef" | "lamb">;

type UnifiedMeatCatalogPageProps = {
  initialFilters?: MeatCatalogFilters;
  speciesPage?: DedicatedSpecies;
};


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
  if (speciesPage !== "beef") {
    preload("/assets/catalog/meat/primebeef/hero.webp", { as: "image", fetchPriority: "high" });
  }
  const [products, categoryOptions] = await Promise.all([getPublishedMeatItems(), getCatalogCommonOptions()]);

  if (
    speciesPage &&
    !products.some((product) => product.meat.species === speciesPage)
  ) {
    notFound();
  }

  const content = speciesPage ? pageContent[speciesPage] : pageContent.all;
  const bullHero = speciesPage === "beef";
  const filters = normalizeMeatCatalogFilters(initialFilters, products, speciesPage);
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
