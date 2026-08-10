import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PartnersMap } from "@/components/PartnersMap";
import { PartnersSection } from "@/components/PartnersSection";
import homeStyles from "@/app/home.module.css";

import styles from "./partners.module.css";

export const metadata: Metadata = {
  title: "Рестораны и магазины на карте — Genlix",
  description: "Карта ресторанов и магазинов, где представлена продукция Primebeef в Беларуси.",
};

export default function PartnersPage() {
  return (
    <main className={homeStyles.page}>
      <Header activeLink="Партнёры" static />

      <Breadcrumbs
        items={[
          { label: "Главная", href: "/" },
          { label: "Партнёры" },
        ]}
      />

      <section className={styles.section} aria-labelledby="partners-map-title">
        <div className={homeStyles.shell}>
          <h1 className={styles.title} id="partners-map-title">
            Рестораны и магазины <span>на карте</span>
          </h1>

          <PartnersMap />
        </div>
      </section>

      <PartnersSection />
      <Footer />
    </main>
  );
}
