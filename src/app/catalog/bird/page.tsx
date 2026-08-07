import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ProductCardsSection } from "@/components/ProductCardsSection";
import { SubscribeSection } from "@/components/SubscribeSection";
import { getBirdProducts } from "@/lib/catalog";
import homeStyles from "@/app/home.module.css";
import styles from "./bird.module.css";

export const metadata: Metadata = {
  title: "Птица — каталог Genlix",
  description: "Фермерская птица — стабильные B2B поставки для ресторанов и ритейла.",
};

export default function BirdPage() {
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
            Фермерская птица — стабильные B2B поставки для ресторанов и ритейла
          </h1>
          <p className={styles.heroLead}>
            Качественное охлаждённое и замороженное мясо курицы, утки, индейки и перепела от лучших
            фермерских хозяйств. Стандартизированный калиброванный вес, строгий ветеринарный контроль
            и бережная логистика.
          </p>
        </div>
      </section>

      <ProductCardsSection title="Птица" products={getBirdProducts()} />

      <SubscribeSection />
      <Footer />
    </main>
  );
}
