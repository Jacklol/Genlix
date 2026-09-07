import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CatalogCategoryNav } from "@/components/CatalogCategoryNav";
import { CatalogEmptyState } from "@/components/CatalogEmptyState";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import type { ProductCardData } from "@/components/ProductCard";
import { ProductCardsSection } from "@/components/ProductCardsSection";
import { SubscribeSection } from "@/components/SubscribeSection";
import {
  getPublishedCategoryProducts,
  getPublishedMeatItems,
} from "@/lib/cms/repository";
import homeStyles from "@/app/home.module.css";
import styles from "./bird.module.css";

export const metadata: Metadata = {
  title: "Птица — каталог Genlix",
  description: "Фермерская птица — стабильные B2B поставки для ресторанов и ритейла.",
};

export const dynamic = "force-dynamic";

function mergeUniqueProducts(...groups: ProductCardData[][]) {
  const productsBySlug = new Map<string, ProductCardData>();

  for (const product of groups.flat()) {
    const key = product.slug ?? `${product.title}:${product.image}`;

    if (!productsBySlug.has(key)) {
      productsBySlug.set(key, product);
    }
  }

  return Array.from(productsBySlug.values());
}

export default async function BirdPage() {
  const [birdProducts, meatProducts] = await Promise.all([
    getPublishedCategoryProducts("bird"),
    getPublishedMeatItems(),
  ]);
  const products = mergeUniqueProducts(
    birdProducts,
    meatProducts.filter((product) => product.meat.species === "poultry"),
  );

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

      <CatalogCategoryNav activeCategory="bird" />

      <section className={styles.hero} aria-labelledby="bird-title">
        <div className={styles.heroInner}>
          <p className={styles.brandBadge}>
            <strong>Premium Poultry</strong>
          </p>
          <h1 id="bird-title">
            Фермерская птица — стабильные B2B поставки для ресторанов и ритейла
          </h1>
          <p className={styles.heroLead}>
            Качественное охлаждённое и замороженное мясо курицы, утки, индейки и перепела от лучших
            фермерских хозяйств. Стандартизированный калиброванный вес, строгий ветеринарный контроль
            и бережная логистика.
          </p>
        </div>
      </section>

      {products.length > 0 ? (
        <ProductCardsSection title="Птица" products={products} />
      ) : (
        <CatalogEmptyState categoryName="Птица" />
      )}

      <SubscribeSection />
      <Footer />
    </main>
  );
}
