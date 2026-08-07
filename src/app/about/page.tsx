import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SubscribeSection } from "@/components/SubscribeSection";
import homeStyles from "@/app/home.module.css";

import styles from "./about.module.css";

export const metadata: Metadata = {
  title: "О компании — Genlix",
  description:
    "Поставляем premium-продукцию для HoReCa и ритейла, контролируя качество, хранение и логистику на каждом этапе сотрудничества.",
};

export default function AboutPage() {
  return (
    <main className={homeStyles.page}>
      <Header activeLink="О компании" static />

      <Breadcrumbs
        items={[
          { label: "Главная", href: "/" },
          { label: "О компании" },
        ]}
      />

      <section className={styles.hero} aria-labelledby="about-hero-title">
        <div className={styles.heroInner}>
          <h1 className={styles.title} id="about-hero-title">
            Качество, на котором строятся партнёрства
          </h1>
          <p className={styles.lead}>
            Поставляем premium-продукцию для HoReCa и ритейла, контролируя качество, хранение и
            логистику на каждом этапе сотрудничества.
          </p>
          <div className={styles.actions}>
            <a className={styles.primaryButton} href="#about-content">
              Узнать о компании
            </a>
            <a className={styles.secondaryButton} href="#certificates">
              Смотреть сертификаты
            </a>
          </div>
        </div>
      </section>

      <SubscribeSection />
      <Footer />
    </main>
  );
}
