"use client";

import { useId, useState, type CSSProperties } from "react";

import {
  featuredNewsArticle,
  getNewsArticlesByFilter,
  NEWS_PAGE_SIZE,
  newsFilters,
  type NewsFilterId,
} from "@/lib/news";

import styles from "@/app/news/news.module.css";

const featuredArticle = {
  label: featuredNewsArticle.tag,
  title: featuredNewsArticle.title,
  description: featuredNewsArticle.description,
  image: featuredNewsArticle.image,
  href: featuredNewsArticle.href,
} as const;

export function NewsPageContent() {
  const panelId = useId();
  const [activeFilter, setActiveFilter] = useState<NewsFilterId>("all");
  const [visibleCount, setVisibleCount] = useState(NEWS_PAGE_SIZE);
  const filteredArticles = getNewsArticlesByFilter(activeFilter);
  const visibleArticles = filteredArticles.slice(0, visibleCount);
  const hasMore = visibleCount < filteredArticles.length;
  const showFeatured = activeFilter === "all";

  const handleFilterChange = (filterId: NewsFilterId) => {
    setActiveFilter(filterId);
    setVisibleCount(NEWS_PAGE_SIZE);
  };

  return (
    <>
      <div className={styles.filters} role="tablist" aria-label="Категории материалов">
        {newsFilters.map((filter) => {
          const isActive = activeFilter === filter.id;

          return (
            <button
              aria-controls={panelId}
              aria-selected={isActive}
              className={`${styles.filterButton} ${isActive ? styles.filterButtonActive : ""}`}
              id={`${panelId}-${filter.id}`}
              key={filter.id}
              role="tab"
              type="button"
              onClick={() => handleFilterChange(filter.id)}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {showFeatured ? (
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
      ) : null}

      <div
        className={`${styles.grid} ${showFeatured ? "" : styles.gridNoFeatured}`}
        id={panelId}
        role="tabpanel"
        aria-labelledby={`${panelId}-${activeFilter}`}
      >
        {visibleArticles.length > 0 ? (
          visibleArticles.map((article) => (
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
                  <time className={styles.cardDate} dateTime={article.dateTime}>
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
          ))
        ) : (
          <p className={styles.emptyState}>В этой категории пока нет материалов.</p>
        )}
      </div>

      {hasMore ? (
        <div className={styles.loadMoreWrap}>
          <button
            className={styles.loadMoreButton}
            type="button"
            onClick={() => setVisibleCount((count) => count + NEWS_PAGE_SIZE)}
          >
            Показать еще
          </button>
        </div>
      ) : null}
    </>
  );
}
