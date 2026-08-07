import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ProductCardsSection } from "@/components/ProductCardsSection";
import { SubscribeSection } from "@/components/SubscribeSection";
import { getBeerProducts } from "@/lib/catalog";
import homeStyles from "@/app/home.module.css";
import styles from "./beer.module.css";

export const metadata: Metadata = {
  title: "Пиво — каталог Genlix",
  description: "Премиальное пиво — эксклюзивный ассортимент для ресторанов, баров и розничных сетей.",
};

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

      <ProductCardsSection title="Пиво" products={getBeerProducts()} />

      <SubscribeSection />
      <Footer />
    </main>
  );
}
