import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CategoryCatalogSection } from "@/components/CategoryCatalog/Section";
import type { CatalogQuery } from "@/lib/catalog/filter-engine";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SubscribeSection } from "@/components/SubscribeSection";
import homeStyles from "@/app/home.module.css";
import styles from "./beer.module.css";

export const metadata: Metadata = {
  title: "Пиво — каталог Genlix",
  description: "Премиальное пиво — эксклюзивный ассортимент для ресторанов, баров и розничных сетей.",
};

export const dynamic = "force-dynamic";

export default async function BeerPage({ searchParams }: { searchParams: Promise<CatalogQuery> }) {

  return (
    <main className={homeStyles.page}>
      <Header activeLink="Каталог" static />

      <Breadcrumbs
        items={[
          { label: "Главная", href: "/" },
          { label: "Каталог", href: "/#catalog" },
          { label: "Пиво" },
        ]}
      />

      <section className={styles.hero} aria-labelledby="beer-title">
        <div className={styles.heroInner}>
          <p className={styles.brandBadge}>
            <strong>Genlix Premium</strong>
          </p>
          <h1 id="beer-title">Премиальное пиво</h1>
          <p className={styles.heroLead}>
            Крафтовое и импортное пиво для ресторанов, баров и розничных сетей.
          </p>
        </div>
      </section>

      <CategoryCatalogSection category="beer" searchParams={searchParams} />

      <SubscribeSection />
      <Footer />
    </main>
  );
}
