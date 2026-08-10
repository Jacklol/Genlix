import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SubscribeSection } from "@/components/SubscribeSection";
import {
  getAllNewsSlugs,
  getNewsArticleBySlug,
  getRelatedNewsArticles,
  type NewsContentBlock,
} from "@/lib/news";
import homeStyles from "@/app/home.module.css";

import styles from "./article.module.css";

type NewsArticlePageProps = {
  params: Promise<{ slug: string }>;
};

function renderContentBlock(block: NewsContentBlock, index: number) {
  switch (block.type) {
    case "heading":
      return <h2 key={`heading-${index}`}>{block.text}</h2>;
    case "list":
      return (
        <ul key={`list-${index}`}>
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    default:
      return <p key={`paragraph-${index}`}>{block.text}</p>;
  }
}

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

  return (
    <main className={homeStyles.page}>
      <Header activeLink="Новости" static />

      <Breadcrumbs
        items={[
          { label: "Главная", href: "/" },
          { label: "Новости", href: "/news" },
          { label: article.title },
        ]}
      />

      <section className={styles.section} aria-labelledby="article-title">
        <div className={homeStyles.shell}>
          <div className={styles.layout}>
            <article className={styles.article}>
              <header>
                <div className={styles.meta}>
                  <span className={styles.tag}>{article.tag}</span>
                  <time className={styles.date} dateTime={article.dateTime}>
                    {article.date}
                  </time>
                </div>
                <h1 className={styles.title} id="article-title">
                  {article.title}
                </h1>
                <p className={styles.lead}>{article.description}</p>
              </header>

              <figure className={styles.cover}>
                <img alt="" height={520} src={article.image} width={1200} />
              </figure>

              <div className={styles.content}>
                {article.content.map((block, index) => renderContentBlock(block, index))}
              </div>

              <a className={styles.backLink} href="/news">
                ← Все новости
              </a>
            </article>

            <aside className={styles.sidebar} aria-label="Дополнительные материалы">
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
            </aside>
          </div>
        </div>
      </section>

      <SubscribeSection />
      <Footer />
    </main>
  );
}
