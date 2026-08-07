import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CatalogProductsSection } from "@/components/CatalogProductsSection";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MeatCutsMap } from "@/components/MeatCutsMap";
import { PartnersSection } from "@/components/PartnersSection";
import { ProductCardsSection } from "@/components/ProductCardsSection";
import { SubscribeSection } from "@/components/SubscribeSection";
import {
  getPrimebeefDetailedProducts,
  getPrimebeefHorecaProducts,
  getPrimebeefRetailProducts,
} from "@/lib/catalog";
import homeStyles from "@/app/home.module.css";
import styles from "./primebeef.module.css";

export const metadata: Metadata = {
  title: "Primebeef — каталог Genlix",
  description: "Primebeef — мясо для профессионалов и гурманов.",
};

export default function PrimebeefPage() {
  return (
    <main className={homeStyles.page}>
      <Header activeLink="Каталог" static />

      <Breadcrumbs
        items={[
          { label: "Главная", href: "/" },
          { label: "Каталог", href: "/#catalog" },
          { label: "Мясо", href: "/catalog/meat" },
          { label: "Primebeef" },
        ]}
      />

      <section className={styles.hero} aria-labelledby="primebeef-title">
        <div className={styles.heroInner}>
          <p className={styles.brandBadge}>
            <strong>Primebeef</strong>
          </p>
          <h1 id="primebeef-title">
            Primebeef — мясо для
            <br />
            профессионалов и гурманов
          </h1>
          <p className={styles.heroLead}>
            Готовая упаковка для розничных магазинов и сетей. Средний ценовой сегмент.
            <br />
            Оптимизированная логистика и стандартизированный вес.
          </p>
        </div>
      </section>

      <MeatCutsMap />

      <ProductCardsSection products={getPrimebeefDetailedProducts()} />

      <CatalogProductsSection
        variant="dark"
        title="Для ресторанов и шеф-поваров (HoReCa)"
        subtitle="Крупнокусковые отрубы, индивидуальные условия поставок, вызревание на заказ."
        products={getPrimebeefHorecaProducts()}
      />

      <CatalogProductsSection
        variant="light"
        title="Для торговых сетей и ритейла"
        subtitle="Готовая продукция в стильной брендированной вакуумной упаковке с фиксированным весом."
        products={getPrimebeefRetailProducts()}
      />

      <PartnersSection />
      <SubscribeSection />
      <Footer />
    </main>
  );
}
