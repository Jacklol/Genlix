import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MeatCatalogBrowser } from "@/components/MeatCatalogBrowser";
import { ProductCardsSection } from "@/components/ProductCardsSection";
import { SubscribeSection } from "@/components/SubscribeSection";
import { getMiratorgRetailMeatItems, getMiratorgSection } from "@/lib/catalog";
import homeStyles from "@/app/home.module.css";
import styles from "./miratorg.module.css";

export const metadata: Metadata = {
  title: "Мираторг — каталог Genlix",
  description: "Мираторг — доступное качество для вашей витрины.",
};

export default function MiratorgPage() {
  return (
    <main className={homeStyles.page}>
      <Header activeLink="Каталог" static />

      <Breadcrumbs
        items={[
          { label: "Главная", href: "/" },
          { label: "Каталог", href: "/#catalog" },
          { label: "Мясо", href: "/catalog/meat" },
          { label: "Мираторг" },
        ]}
      />

      <section className={styles.hero} aria-labelledby="miratorg-title">
        <div className={styles.heroInner}>
          <div className={styles.brandRow}>
            <p className={styles.brandBadge}>
              <strong>Мираторг</strong>
            </p>
            <span className={styles.retailBadge}>Только для ритейла</span>
          </div>
          <h1 id="miratorg-title">Мираторг — доступное качество для вашей витрины</h1>
          <p className={styles.heroLead}>
            Готовая упаковка для розничных магазинов и сетей. Проверенный ценовой сегмент,
            стандартизированная логистика и стабильный запас.
          </p>
        </div>
      </section>

      <MeatCatalogBrowser
        id="miratorg-products"
        products={getMiratorgRetailMeatItems()}
        subtitle="Готовая продукция для торговых сетей и розничных магазинов."
        title="Розничный ассортимент Мираторг"
      />

      <ProductCardsSection
        variant="dark"
        title="Хиты продаж в сетях"
        linkLabel="Смотреть всю аналитику ритейла"
        linkHref="/#contacts"
        products={getMiratorgSection("hits")}
      />

      <ProductCardsSection
        variant="muted"
        title="Новые поступления"
        linkLabel="Получить спец-цену на новинки"
        linkHref="/#contacts"
        products={getMiratorgSection("new")}
      />

      <ProductCardsSection
        title="Для идеальной выкладки витрины"
        linkLabel="Заказать аудит планограммы"
        linkHref="/#contacts"
        products={getMiratorgSection("showcase")}
      />

      <SubscribeSection />
      <Footer />
    </main>
  );
}
