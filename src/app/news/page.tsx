import type { CSSProperties } from "react";
import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SubscribeSection } from "@/components/SubscribeSection";
import { newsArticles } from "@/lib/news";
import homeStyles from "@/app/home.module.css";

import styles from "./news.module.css";

export const metadata: Metadata = {
  title: "Новости — Genlix",
  description: "Полезные материалы для профессионалов: кейсы, поставки, выбор и приготовление мяса.",
};

const filters = [
  "Все материалы",
  "Кейсы сотрудничества",
  "Новые поставки и отрубы",
  "Выбор и приготовление",
  "Фермы-поставщики",
] as const;

const featuredArticle = {
  label: "Главный материал",
  title: "Как выстроить стабильные поставки для ресторана",
  description:
    "Разбираем основные этапы: подбор ассортимента, согласование фасовки, планирование графика и контроль качества.",
  image: "/assets/news/news_hero.png",
  href: "#",
} as const;

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

          <div className={styles.filters} role="tablist" aria-label="Категории материалов">
            {filters.map((filter, index) => (
              <button
                className={`${styles.filterButton} ${index === 0 ? styles.filterButtonActive : ""}`}
                key={filter}
                type="button"
              >
                {filter}
              </button>
            ))}
          </div>

          <article className={styles.featured}>
            <div
              className={styles.featuredMedia}
              style={{ "--featured-image": `url("${featuredArticle.image}")` } as CSSProperties}
              aria-hidden="true"
            />

            <div className={styles.featuredPanel}>
              <p className={styles.featuredLabel}>{featuredArticle.label}</p>
              <h2 className={styles.featuredTitle}>{featuredArticle.title}</h2>
              <p className={styles.featuredDescription}>{featuredArticle.description}</p>
              <a className={styles.featuredButton} href={featuredArticle.href}>
                Читать
              </a>
            </div>
          </article>

          <div className={styles.grid}>
            {newsArticles.map((article) => (
              <article className={styles.card} key={article.slug}>
                <a
                  className={styles.cardMediaLink}
                  href={article.href}
                  style={{ "--card-image": `url("${article.image}")` } as CSSProperties}
                >
                  <div className={styles.cardMedia} aria-hidden="true" />
                </a>

                <div className={styles.cardBody}>
                  <div className={styles.cardMeta}>
                    <span className={styles.cardTag}>{article.tag}</span>
                    <time className={styles.cardDate} dateTime="2026-07-18">
                      {article.date}
                    </time>
                  </div>

                  <h2 className={styles.cardTitle}>
                    <a className={styles.cardTitleLink} href={article.href}>
                      {article.title}
                    </a>
                  </h2>

                  <p className={styles.cardDescription}>{article.description}</p>

                  <a className={styles.cardLink} href={article.href}>
                    Читать статью
                  </a>
                </div>
              </article>
            ))}
          </div>

          <div className={styles.loadMoreWrap}>
            <button className={styles.loadMoreButton} type="button">
              Показать еще
            </button>
          </div>
        </div>
      </section>

      <SubscribeSection />
      <Footer />
    </main>
  );
}
