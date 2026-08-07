import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import type { ProductCardData } from "@/components/ProductCard";
import { ProductCardsSection } from "@/components/ProductCardsSection";
import { SubscribeSection } from "@/components/SubscribeSection";
import { GOVYAZHIJ_FARSH_SLUG } from "@/lib/products";
import homeStyles from "@/app/home.module.css";
import styles from "./miratorg.module.css";

export const metadata: Metadata = {
  title: "Мираторг — каталог Genlix",
  description: "Мираторг — доступное качество для вашей витрины.",
};

const sharedProductSpecs = [
  { label: "Фасовка", value: "блок 5+ кг / вакуум 0,8 кг" },
  { label: "Мраморность", value: "5" },
  { label: "Вызревание", value: "сухое вызревание 28 дней" },
  { label: "Хранение", value: "0...+4°C" },
] as const;

const detailedProducts: ProductCardData[] = [
  {
    image: "/assets/catalog/meat/miratorg/mt_pr1.png",
    slug: GOVYAZHIJ_FARSH_SLUG,
    brand: "Мираторг",
    title: "Говяжий фарш домашний",
    specs: [...sharedProductSpecs],
    tags: ["гриль", "жарка"],
    recommendation: "Рекомендуемое пиво: IPA, Porter",
    buttonLabel: "Запросить розничную поставку",
  },
  {
    image: "/assets/catalog/meat/miratorg/mt_pr2.png",
    brand: "Мираторг",
    title: "Антрекот охлаждённый B2B",
    specs: [...sharedProductSpecs],
    tags: ["гриль", "жарка"],
    recommendation: "Рекомендуемое пиво: IPA, Porter",
    buttonLabel: "Запросить розничную поставку",
  },
  {
    image: "/assets/catalog/meat/miratorg/mt_pr3.png",
    brand: "Мираторг",
    title: "Гуляш из говядины",
    specs: [...sharedProductSpecs],
    tags: ["гриль", "жарка"],
    recommendation: "Рекомендуемое пиво: IPA, Porter",
    buttonLabel: "Запросить розничную поставку",
  },
  {
    image: "/assets/catalog/meat/miratorg/mt_pr4.png",
    brand: "Мираторг",
    title: "Филе куриное охлаждённое",
    specs: [...sharedProductSpecs],
    tags: ["гриль", "жарка"],
    recommendation: "Рекомендуемое пиво: IPA, Porter",
    buttonLabel: "Запросить розничную поставку",
  },
  {
    image: "/assets/catalog/meat/miratorg/mt_pr5.png",
    brand: "Мираторг",
    title: "Котлеты домашние из свинины",
    specs: [...sharedProductSpecs],
    tags: ["гриль", "жарка"],
    recommendation: "Рекомендуемое пиво: IPA, Porter",
    buttonLabel: "Запросить розничную поставку",
  },
  {
    image: "/assets/catalog/meat/miratorg/mt_pr6.png",
    brand: "Мираторг",
    title: "Стейк Рибай Прайм",
    specs: [...sharedProductSpecs],
    tags: ["гриль", "жарка"],
    recommendation: "Рекомендуемое пиво: IPA, Porter",
    buttonLabel: "Запросить розничную поставку",
  },
];

const hitProducts: ProductCardData[] = [
  {
    image: "/assets/catalog/meat/miratorg/mt_hits1.png",
    badge: "хит",
    slug: GOVYAZHIJ_FARSH_SLUG,
    brand: "Мираторг",
    title: "Говяжий фарш домашний",
    specs: [...sharedProductSpecs],
    tags: ["гриль", "жарка"],
    recommendation: "Рекомендуемое пиво: IPA, Porter",
    buttonLabel: "Запросить розничную поставку",
  },
  {
    image: "/assets/catalog/meat/miratorg/mt_hits2.png",
    badge: "хит",
    brand: "Мираторг",
    title: "Антрекот охлаждённый B2B",
    specs: [...sharedProductSpecs],
    tags: ["гриль", "жарка"],
    recommendation: "Рекомендуемое пиво: IPA, Porter",
    buttonLabel: "Запросить розничную поставку",
  },
  {
    image: "/assets/catalog/meat/miratorg/mt_hits3.png",
    badge: "хит",
    brand: "Мираторг",
    title: "Гуляш из говядины",
    specs: [...sharedProductSpecs],
    tags: ["гриль", "жарка"],
    recommendation: "Рекомендуемое пиво: IPA, Porter",
    buttonLabel: "Запросить розничную поставку",
  },
];

const newProducts: ProductCardData[] = [
  {
    image: "/assets/catalog/meat/miratorg/mt_new1.png",
    badge: "new",
    brand: "Мираторг",
    title: "Филе куриное охлаждённое",
    specs: [...sharedProductSpecs],
    tags: ["гриль", "жарка"],
    recommendation: "Рекомендуемое пиво: IPA, Porter",
    buttonLabel: "Запросить розничную поставку",
  },
  {
    image: "/assets/catalog/meat/miratorg/mt_new2.png",
    badge: "new",
    brand: "Мираторг",
    title: "Котлеты домашние из свинины",
    specs: [...sharedProductSpecs],
    tags: ["гриль", "жарка"],
    recommendation: "Рекомендуемое пиво: IPA, Porter",
    buttonLabel: "Запросить розничную поставку",
  },
  {
    image: "/assets/catalog/meat/miratorg/mt_new3.png",
    badge: "new",
    brand: "Мираторг",
    title: "Стейк Рибай Прайм",
    specs: [...sharedProductSpecs],
    tags: ["гриль", "жарка"],
    recommendation: "Рекомендуемое пиво: IPA, Porter",
    buttonLabel: "Запросить розничную поставку",
  },
];

const showcaseProducts: ProductCardData[] = [
  {
    image: "/assets/catalog/meat/miratorg/mt_ideal1.png",
    badge: "витрина",
    slug: GOVYAZHIJ_FARSH_SLUG,
    brand: "Мираторг",
    title: "Говяжий фарш домашний",
    specs: [...sharedProductSpecs],
    tags: ["гриль", "жарка"],
    recommendation: "Рекомендуемое пиво: IPA, Porter",
    buttonLabel: "Запросить розничную поставку",
  },
  {
    image: "/assets/catalog/meat/miratorg/mt_ideal2.png",
    badge: "витрина",
    brand: "Мираторг",
    title: "Гуляш из говядины",
    specs: [...sharedProductSpecs],
    tags: ["гриль", "жарка"],
    recommendation: "Рекомендуемое пиво: IPA, Porter",
    buttonLabel: "Запросить розничную поставку",
  },
  {
    image: "/assets/catalog/meat/miratorg/mt_ideal3.png",
    badge: "витрина",
    brand: "Primebeef",
    title: "Котлеты домашние из свинины",
    specs: [...sharedProductSpecs],
    tags: ["гриль", "жарка"],
    recommendation: "Рекомендуемое пиво: IPA, Porter",
    buttonLabel: "Запросить оптовое предложение",
  },
];

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

      <ProductCardsSection title="Продукция Мираторг" products={detailedProducts} />

      <ProductCardsSection
        variant="dark"
        title="Хиты продаж в сетях"
        linkLabel="Смотреть всю аналитику ритейла"
        linkHref="/#contacts"
        products={hitProducts}
      />

      <ProductCardsSection
        variant="muted"
        title="Новые поступления"
        linkLabel="Получить спец-цену на новинки"
        linkHref="/#contacts"
        products={newProducts}
      />

      <ProductCardsSection
        title="Для идеальной выкладки витрины"
        linkLabel="Заказать аудит планограммы"
        linkHref="/#contacts"
        products={showcaseProducts}
      />

      <SubscribeSection />
      <Footer />
    </main>
  );
}
