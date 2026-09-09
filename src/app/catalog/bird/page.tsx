import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CategoryCatalogSection } from "@/components/CategoryCatalog/Section";
import type { CatalogQuery } from "@/lib/catalog/filter-engine";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SubscribeSection } from "@/components/SubscribeSection";
import homeStyles from "@/app/home.module.css";
import styles from "./bird.module.css";

export const metadata: Metadata = {
  title: "Птица — каталог Genlix",
  description: "Фермерская птица — стабильные B2B поставки для ресторанов и ритейла.",
};

export const dynamic = "force-dynamic";

export default async function BirdPage({ searchParams }: { searchParams: Promise<CatalogQuery> }) {

  return (
    <main className={homeStyles.page}>
      <Header activeLink="Каталог" static />

      <Breadcrumbs
        items={[
          { label: "Главная", href: "/" },
          { label: "Каталог", href: "/#catalog" },
          { label: "Птица" },
        ]}
      />

      <section className={styles.hero} aria-labelledby="bird-title">
        <div className={styles.heroInner}>
          <p className={styles.brandBadge}>
            <strong>Premium Poultry</strong>
          </p>
          <h1 id="bird-title">
            Фермерская птица
          </h1>
          <p className={styles.heroLead}>
            Охлаждённая и замороженная птица для ресторанов и ритейла.
          </p>
        </div>
      </section>

      <CategoryCatalogSection category="bird" searchParams={searchParams} />

      <SubscribeSection />
      <Footer />
    </main>
  );
}
