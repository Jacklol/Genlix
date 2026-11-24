import type { ReactNode } from "react";
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

function MeatHeroCopy({ speciesPage }: Pick<UnifiedMeatCatalogPageProps, "speciesPage">) {
  const content = pageContent[speciesPage ?? "all"];
  if (speciesPage === "beef") {
    return <header className={styles.catalogHeading}><h1 id="meat-page-title">{content.title}</h1></header>;
  }
  return (
    <div className={styles.heroContent}>
      <div className={homeStyles.shell}>
        <div className={styles.heroCopy}>
          <p>{content.eyebrow}</p>
          <h1 id="meat-page-title">{content.title}</h1>
          <span>{content.description}</span>
        </div>
      </div>
    </div>
  );
}

export function MeatCatalogFrame({ children, speciesPage }: {
  children: ReactNode;
  speciesPage?: DedicatedSpecies;
}) {
  if (speciesPage !== "beef") {
    preload("/assets/catalog/meat/primebeef/hero.webp", { as: "image", fetchPriority: "high" });
  }
  return (
    <main className={homeStyles.page}>
      <Header activeLink="Каталог" static />
      <Breadcrumbs
        variant={speciesPage === "beef" ? "dark" : "default"}
        items={[
          { label: "Главная", href: "/" },
          { label: "Каталог", href: "/#catalog" },
          ...(speciesPage
            ? [{ label: "Мясо", href: "/catalog/meat" }, { label: speciesLabels[speciesPage] }]
            : [{ label: "Мясо" }]),
        ]}
      />
      {children}
      <SubscribeSection />
      <Footer />
    </main>
  );
}

export async function MeatCatalogContents({
  initialFilters = {},
  speciesPage,
}: UnifiedMeatCatalogPageProps) {
  const [products, categoryOptions] = await Promise.all([getPublishedMeatItems(), getCatalogCommonOptions()]);
  if (speciesPage && !products.some((product) => product.meat.species === speciesPage)) {
    notFound();
  }
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
    <UnifiedMeatCatalog
      categoryOptions={categoryOptions}
      heroClassName={styles.hero}
      hero={<MeatHeroCopy speciesPage={speciesPage} />}
      initialFilters={filters}
      key={filterStateKey}
      products={products}
      speciesPage={speciesPage}
    />
  );
}

export function UnifiedMeatCatalogPage(props: UnifiedMeatCatalogPageProps) {
  return (
    <MeatCatalogFrame speciesPage={props.speciesPage}>
      <MeatCatalogContents {...props} />
    </MeatCatalogFrame>
  );
}

export function MeatCatalogLoadingHero({ children }: { children: ReactNode }) {
  return (
    <section className={styles.hero} aria-labelledby="meat-page-title" data-catalog-hero>
      <MeatHeroCopy />
      {children}
    </section>
  );
}
