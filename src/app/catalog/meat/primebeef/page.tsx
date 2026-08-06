import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CatalogProductsSection } from "@/components/CatalogProductsSection";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PartnersSection } from "@/components/PartnersSection";
import { SubscribeSection } from "@/components/SubscribeSection";
import homeStyles from "@/app/home.module.css";
import styles from "./primebeef.module.css";

export const metadata: Metadata = {
  title: "Primebeef — каталог Genlix",
  description: "Primebeef — мясо для профессионалов и гурманов.",
};

const horecaProducts = [
  {
    name: "Толстый край",
    meta: "Блок 5.5 кг • Мраморность 4+",
    image: "/assets/home/category1.jpg",
  },
  {
    name: "Толстый край",
    meta: "Блок 5.5 кг • Мраморность 4+",
    image: "/assets/home/news_item1.jpg",
  },
  {
    name: "Толстый край",
    meta: "Блок 5.5 кг • Мраморность 4+",
    image: "/assets/home/news_item2.jpg",
  },
] as const;

const retailProducts = [
  {
    name: "Стейк Рибай в вакууме",
    meta: "Порция 0.8 кг • Фикс. вес",
    image: "/assets/home/news_item3.jpg",
  },
  {
    name: "Стейк Нью-Йорк",
    meta: "Порция 0.8 кг • Фикс. вес",
    image: "/assets/home/news_item4.jpg",
  },
  {
    name: "Стейк Рибай в вакууме",
    meta: "Порция 0.8 кг • Фикс. вес",
    image: "/assets/home/category2.jpg",
  },
  {
    name: "Стейк Нью-Йорк",
    meta: "Порция 0.8 кг • Фикс. вес",
    image: "/assets/home/category3.jpg",
  },
] as const;

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

      <CatalogProductsSection
        variant="dark"
        title="Для ресторанов и шеф-поваров (HoReCa)"
        subtitle="Крупнокусковые отрубы, индивидуальные условия поставок, вызревание на заказ."
        products={[...horecaProducts]}
      />

      <CatalogProductsSection
        variant="light"
        title="Для торговых сетей и ритейла"
        subtitle="Готовая продукция в стильной брендированной вакуумной упаковке с фиксированным весом."
        products={[...retailProducts]}
      />

      <PartnersSection />
      <SubscribeSection />
      <Footer />
    </main>
  );
}
