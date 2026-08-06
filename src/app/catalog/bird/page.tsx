import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import type { ProductCardData } from "@/components/ProductCard";
import { ProductCardsSection } from "@/components/ProductCardsSection";
import { SubscribeSection } from "@/components/SubscribeSection";
import homeStyles from "@/app/home.module.css";
import styles from "./bird.module.css";

export const metadata: Metadata = {
  title: "Птица — каталог Genlix",
  description: "Фермерская птица — стабильные B2B поставки для ресторанов и ритейла.",
};

const sharedBirdSpecs = [
  { label: "Упаковка", value: "вакуум 0,8 кг / короб 10 кг" },
  { label: "Срок годности", value: "10 суток" },
  { label: "Хранение", value: "0...+4°C" },
] as const;

const birdProducts: ProductCardData[] = [
  {
    image: "/assets/catalog/bird/bird1.png",
    badge: "ферма",
    brand: "Петелинка",
    title: "Филе куриное фермерское",
    specs: [...sharedBirdSpecs],
    tags: ["запекание", "варка"],
    recommendation: "Рекомендуемое пиво: Blond Ale, Wheat",
    buttonLabel: "Запросить коммерческое предложение",
  },
  {
    image: "/assets/catalog/bird/bird2.png",
    badge: "ферма",
    brand: "Озёрская утка",
    title: "Утиная грудка охлаждённая",
    specs: [...sharedBirdSpecs],
    tags: ["жарка", "запекание"],
    recommendation: "Рекомендуемое пиво: Dubbel, Amber Ale",
    buttonLabel: "Запросить коммерческое предложение",
  },
  {
    image: "/assets/catalog/bird/bird3.png",
    badge: "ферма",
    brand: "Индилайт",
    title: "Индейка филе грудки",
    specs: [...sharedBirdSpecs],
    tags: ["запекание", "гриль"],
    recommendation: "Рекомендуемое пиво: Pale Ale, Lager",
    buttonLabel: "Запросить коммерческое предложение",
  },
  {
    image: "/assets/catalog/bird/bird4.png",
    badge: "ферма",
    brand: "Перепёлкино",
    title: "Перепел тушка охлаждённая",
    specs: [...sharedBirdSpecs],
    tags: ["запекание", "гриль"],
    recommendation: "Рекомендуемое пиво: Pilsner, Belgian Single",
    buttonLabel: "Запросить коммерческое предложение",
  },
  {
    image: "/assets/catalog/bird/bird5.png",
    badge: "ферма",
    brand: "Петелинка",
    title: "Куриные бёдра охлаждённые",
    specs: [...sharedBirdSpecs],
    tags: ["жарка", "гриль"],
    recommendation: "Рекомендуемое пиво: IPA, APA",
    buttonLabel: "Запросить коммерческое предложение",
  },
  {
    image: "/assets/catalog/bird/bird6.png",
    badge: "ферма",
    brand: "Петелинка",
    title: "Крылья куриные фермерские",
    specs: [...sharedBirdSpecs],
    tags: ["жарка", "запекание"],
    recommendation: "Рекомендуемое пиво: Double IPA, Porter",
    buttonLabel: "Запросить коммерческое предложение",
  },
];

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

      <ProductCardsSection title="Птица" products={birdProducts} />

      <SubscribeSection />
      <Footer />
    </main>
  );
}
