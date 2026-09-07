import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { NewsPageContent } from "@/components/NewsPageContent";
import { SubscribeSection } from "@/components/SubscribeSection";
import { getPublishedNewsArticles } from "@/lib/cms/repository";
import homeStyles from "@/app/home.module.css";

import styles from "./news.module.css";

export const metadata: Metadata = {
  title: "Новости — Genlix",
  description: "Полезные материалы для профессионалов: кейсы, поставки, выбор и приготовление мяса.",
};

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const articles = await getPublishedNewsArticles();

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

          <NewsPageContent articles={articles} featuredArticle={articles[0]} />
        </div>
      </section>

      <SubscribeSection />
      <Footer />
    </main>
  );
}
