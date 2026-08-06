import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CatalogProductsSection } from "@/components/CatalogProductsSection";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PartnersSection } from "@/components/PartnersSection";
import type { ProductCardData } from "@/components/ProductCard";
import { ProductCardsSection } from "@/components/ProductCardsSection";
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

const detailedProducts: ProductCardData[] = [
  {
    image: "/assets/home/news_item2.jpg",
    badge: "хит",
    brand: "Мираторг",
    title: "Говяжий фарш домашний",
    specs: [
      { label: "Фасовка", value: "блок 5+ кг / вакуум 0,8 кг" },
      { label: "Мраморность", value: "5" },
      { label: "Вызревание", value: "сухое вызревание 28 дней" },
      { label: "Хранение", value: "0...+4°C" },
    ],
    tags: ["гриль", "жарка"],
    recommendation: "Рекомендуемое пиво: IPA, Porter",
  },
  {
    image: "/assets/home/category1.jpg",
    badge: "new",
    brand: "Primebeef",
    title: "Стейк Рибай премиум",
    specs: [
      { label: "Фасовка", value: "вакуум 0,8 кг" },
      { label: "Мраморность", value: "4+" },
      { label: "Вызревание", value: "сухое вызревание 21 день" },
      { label: "Хранение", value: "0...+4°C" },
    ],
    tags: ["гриль", "запекание"],
    recommendation: "Рекомендуемое пиво: Lager, Stout",
  },
  {
    image: "/assets/home/news_item4.jpg",
    badge: "витрина",
    brand: "Мираторг",
    title: "Оковалок говяжий",
    specs: [
      { label: "Фасовка", value: "блок 5+ кг" },
      { label: "Мраморность", value: "3+" },
      { label: "Вызревание", value: "влажное вызревание 14 дней" },
      { label: "Хранение", value: "0...+4°C" },
    ],
    tags: ["тушение", "запекание"],
    recommendation: "Рекомендуемое пиво: Wheat, Ale",
  },
];

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

      <ProductCardsSection products={detailedProducts} />

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
