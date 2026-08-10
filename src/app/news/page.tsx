import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { NewsPageContent } from "@/components/NewsPageContent";
import { SubscribeSection } from "@/components/SubscribeSection";
import homeStyles from "@/app/home.module.css";

import styles from "./news.module.css";

export const metadata: Metadata = {
  title: "Новости — Genlix",
  description: "Полезные материалы для профессионалов: кейсы, поставки, выбор и приготовление мяса.",
};

export default function NewsPage() {
  return (
    <main className={homeStyles.page}>
      <Header activeLink="Новости" static />

      <Breadcrumbs
        items={[
          { label: "Главная", href: "/" },
          { label: "Новости" },
        ]}
      />

      <section className={styles.section} aria-labelledby="news-page-title">
        <div className={homeStyles.shell}>
          <h1 className={styles.title} id="news-page-title">
            Полезно <span>для профессионалов</span>
          </h1>

          <NewsPageContent />
        </div>
      </section>

      <SubscribeSection />
      <Footer />
    </main>
  );
}
