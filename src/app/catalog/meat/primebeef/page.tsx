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
    image: "/assets/catalog/meat/primebeef/primebeef4.png",
  },
  {
    name: "Толстый край",
    meta: "Блок 5.5 кг • Мраморность 4+",
    image: "/assets/catalog/meat/primebeef/primebeef5.png",
  },
  {
    name: "Толстый край",
    meta: "Блок 5.5 кг • Мраморность 4+",
    image: "/assets/catalog/meat/primebeef/primebeef6.png",
  },
] as const;

const retailProducts = [
  {
    name: "Стейк Рибай в вакууме",
    meta: "Порция 0.8 кг • Фикс. вес",
    image: "/assets/catalog/meat/primebeef/pb1.png",
  },
  {
    name: "Стейк Нью-Йорк",
    meta: "Порция 0.8 кг • Фикс. вес",
    image: "/assets/catalog/meat/primebeef/pb2.png",
  },
  {
    name: "Стейк Рибай в вакууме",
    meta: "Порция 0.8 кг • Фикс. вес",
    image: "/assets/catalog/meat/primebeef/pb3.png",
  },
  {
    name: "Стейк Нью-Йорк",
    meta: "Порция 0.8 кг • Фикс. вес",
    image: "/assets/catalog/meat/primebeef/pb4.png",
  },
] as const;

const sharedProductSpecs = [
  { label: "Фасовка", value: "блок 5+ кг / вакуум 0,8 кг" },
  { label: "Мраморность", value: "5" },
  { label: "Вызревание", value: "сухое вызревание 28 дней" },
  { label: "Хранение", value: "0...+4°C" },
] as const;

const detailedProducts: ProductCardData[] = [
  {
    image: "/assets/catalog/meat/primebeef/primebeef1.png",
    brand: "Primebeef",
    title: "Стейк Рибай Прайм",
    specs: [...sharedProductSpecs],
    tags: ["гриль", "жарка"],
    recommendation: "Рекомендуемое пиво: IPA, Porter",
    buttonLabel: "Запросить оптовое предложение",
  },
  {
    image: "/assets/catalog/meat/primebeef/primebeef2.png",
    brand: "Primebeef",
    title: "Стейк Стриплоин",
    specs: [...sharedProductSpecs],
    tags: ["гриль", "жарка"],
    recommendation: "Рекомендуемое пиво: IPA, Porter",
    buttonLabel: "Запросить оптовое предложение",
  },
  {
    image: "/assets/catalog/meat/primebeef/primebeef3.png",
    brand: "Primebeef",
    title: "Филе-миньон (Тендерлоин)",
    specs: [...sharedProductSpecs],
    tags: ["гриль", "жарка"],
    recommendation: "Рекомендуемое пиво: IPA, Porter",
    buttonLabel: "Запросить оптовое предложение",
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
