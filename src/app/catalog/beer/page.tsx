import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import type { ProductCardData } from "@/components/ProductCard";
import { ProductCardsSection } from "@/components/ProductCardsSection";
import { SubscribeSection } from "@/components/SubscribeSection";
import homeStyles from "@/app/home.module.css";
import styles from "./beer.module.css";

export const metadata: Metadata = {
  title: "Пиво — каталог Genlix",
  description: "Премиальное пиво — эксклюзивный ассортимент для ресторанов, баров и розничных сетей.",
};

const beerProducts: ProductCardData[] = [
  {
    image: "/assets/catalog/beer/beer1.png",
    brand: "Paulaner",
    title: "Paulaner Hefe-Weißbier",
    specs: [
      { label: "Крепость (Алкоголь)", value: "5.5%" },
      { label: "Горечь (IBU)", value: "12" },
    ],
    tags: ["Пшеничное"],
    recommendation: "Идеальное сочетание с мясом: Стейк Рибай, Антрекот",
    buttonLabel: "Запросить поставку",
  },
  {
    image: "/assets/catalog/beer/beer2.png",
    brand: "Guinness",
    title: "Guinness Draught",
    specs: [
      { label: "Крепость (Алкоголь)", value: "4.2%" },
      { label: "Горечь (IBU)", value: "45" },
    ],
    tags: ["Стаут"],
    recommendation: "Идеальное сочетание с мясом: Гуляш из говядины, Грудинка",
    buttonLabel: "Запросить поставку",
  },
  {
    image: "/assets/catalog/beer/beer3.png",
    brand: "Chimay",
    title: "Chimay Blue",
    specs: [
      { label: "Крепость (Алкоголь)", value: "9.0%" },
      { label: "Горечь (IBU)", value: "30" },
    ],
    tags: ["Тёмный эль"],
    recommendation: "Идеальное сочетание с мясом: Филе-миньон, Оковалок",
    buttonLabel: "Запросить поставку",
  },
  {
    image: "/assets/catalog/beer/beer4.png",
    brand: "Pilsner Urquell",
    title: "Pilsner Urquell",
    specs: [
      { label: "Крепость (Алкоголь)", value: "4.4%" },
      { label: "Горечь (IBU)", value: "40" },
    ],
    tags: ["Лагер"],
    recommendation: "Идеальное сочетание с мясом: Куриное филе, Индейка",
    buttonLabel: "Запросить поставку",
  },
  {
    image: "/assets/catalog/beer/beer5.png",
    brand: "BrewDog",
    title: "BrewDog Punk IPA",
    specs: [
      { label: "Крепость (Алкоголь)", value: "5.4%" },
      { label: "Горечь (IBU)", value: "35" },
    ],
    tags: ["IPA"],
    recommendation: "Идеальное сочетание с мясом: Говяжий фарш, Котлеты",
    buttonLabel: "Запросить поставку",
  },
  {
    image: "/assets/catalog/beer/beer6.png",
    brand: "Hoegaarden",
    title: "Hoegaarden",
    specs: [
      { label: "Крепость (Алкоголь)", value: "4.9%" },
      { label: "Горечь (IBU)", value: "15" },
    ],
    tags: ["Светлое пшеничное"],
    recommendation: "Идеальное сочетание с мясом: Утиная грудка, Перепел",
    buttonLabel: "Запросить поставку",
  },
];

export default function BeerPage() {
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

      <ProductCardsSection title="Пиво" products={beerProducts} />

      <SubscribeSection />
      <Footer />
    </main>
  );
}
