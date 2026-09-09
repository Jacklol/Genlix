import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CategoryCatalogSection } from "@/components/CategoryCatalog/Section";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SubscribeSection } from "@/components/SubscribeSection";
import type { CatalogQuery } from "@/lib/catalog/filter-engine";
import homeStyles from "@/app/home.module.css";
import heroStyles from "../beer/beer.module.css";
import styles from "./water.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Вода — каталог Genlix",
  description: "Питьевая и минеральная вода для ресторанов, гостиниц и розничных сетей.",
};

export default function WaterPage({ searchParams }: { searchParams: Promise<CatalogQuery> }) {
  return <main className={homeStyles.page}>
    <Header activeLink="Каталог" static />
    <Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: "Каталог", href: "/#catalog" }, { label: "Вода" }]} />
    <section className={`${heroStyles.hero} ${styles.hero}`} aria-labelledby="water-title">
      <div className={heroStyles.heroInner}>
        <p className={heroStyles.brandBadge}><strong>Genlix Premium</strong></p>
        <h1 id="water-title">Питьевая и минеральная вода</h1>
        <p className={heroStyles.heroLead}>Вода для ресторанов, гостиниц и розничных сетей.</p>
      </div>
    </section>
    <CategoryCatalogSection category="water" searchParams={searchParams} />
    <SubscribeSection /><Footer />
  </main>;
}
