import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CatalogCategoryNav } from "@/components/CatalogCategoryNav";
import { CatalogEmptyState } from "@/components/CatalogEmptyState";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ProductCardsSection } from "@/components/ProductCardsSection";
import { SubscribeSection } from "@/components/SubscribeSection";
import { getPublishedCategoryProducts } from "@/lib/cms/repository";
import homeStyles from "@/app/home.module.css";
import styles from "./beer.module.css";

export const metadata: Metadata = {
  title: "Пиво — каталог Genlix",
  description: "Премиальное пиво — эксклюзивный ассортимент для ресторанов, баров и розничных сетей.",
};

export const dynamic = "force-dynamic";

export default async function BeerPage() {
  const products = await getPublishedCategoryProducts("beer");

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

      <CatalogCategoryNav activeCategory="beer" />

      <section className={styles.hero} aria-labelledby="beer-title">
        <div className={styles.heroInner}>
          <p className={styles.brandBadge}>
            <strong>Genlix Premium</strong>
          </p>
          <h1 id="beer-title">Премиальное пиво</h1>
          <p className={styles.heroLead}>
            Эксклюзивный ассортимент крафтового и импортного пива для ресторанов, баров и розничных
            торговых сетей. Прямые поставки от ведущих пивоварен мира.
          </p>
        </div>
      </section>

      {products.length > 0 ? (
        <ProductCardsSection title="Пиво" products={products} />
      ) : (
        <CatalogEmptyState categoryName="Пиво" />
      )}

      <SubscribeSection />
      <Footer />
    </main>
  );
}
