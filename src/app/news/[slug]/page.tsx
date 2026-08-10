import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TextArticleLayout } from "@/components/TextArticleLayout";
import {
  getAllNewsSlugs,
  getNewsArticleBySlug,
  getRelatedNewsArticles,
} from "@/lib/news";

import styles from "@/components/TextArticleLayout/TextArticleLayout.module.css";

type NewsArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllNewsSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: NewsArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getNewsArticleBySlug(slug);

  if (!article) {
    return { title: "Материал не найден — Genlix" };
  }

  return {
    title: `${article.title} — Genlix`,
    description: article.description,
  };
}

export default async function NewsArticlePage({ params }: NewsArticlePageProps) {
  const { slug } = await params;
  const article = getNewsArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const relatedArticles = getRelatedNewsArticles(slug);

  const sidebar = (
    <>
      {relatedArticles.length > 0 ? (
        <div className={styles.sidebarCard}>
          <h2 className={styles.sidebarTitle}>Читайте также</h2>
          <ul className={styles.relatedList}>
            {relatedArticles.map((item) => (
              <li className={styles.relatedItem} key={item.slug}>
                <a href={item.href}>
                  <span className={styles.relatedTag}>{item.tag}</span>
                  <span className={styles.relatedTitle}>{item.title}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className={styles.ctaCard}>
        <h2 className={styles.sidebarTitle}>Нужно коммерческое предложение?</h2>
        <p>Оставьте заявку — подготовим условия поставок под ваш формат бизнеса.</p>
        <a className={styles.ctaButton} href="/#contacts">
          Оставить заявку
        </a>
      </div>
    </>
  );

  return (
    <TextArticleLayout
      activeLink="Новости"
      backLink={{ href: "/news", label: "← Все новости" }}
      breadcrumbs={[
        { label: "Главная", href: "/" },
        { label: "Новости", href: "/news" },
        { label: article.title },
      ]}
      content={article.content}
      date={article.date}
      dateTime={article.dateTime}
      description={article.description}
      image={article.image}
      sidebar={sidebar}
      tag={article.tag}
      title={article.title}
    />
  );
}
