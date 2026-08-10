import type { ReactNode } from "react";

import type { BreadcrumbItem } from "@/components/Breadcrumbs";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SubscribeSection } from "@/components/SubscribeSection";
import type { TextContentBlock } from "@/lib/text-content";
import { navItems } from "@/lib/site-data";
import homeStyles from "@/app/home.module.css";

import styles from "./TextArticleLayout.module.css";

type TextArticleLayoutProps = {
  activeLink?: (typeof navItems)[number]["label"];
  breadcrumbs: BreadcrumbItem[];
  tag: string;
  date: string;
  dateTime: string;
  title: string;
  description: string;
  content: TextContentBlock[];
  image?: string;
  backLink?: { href: string; label: string };
  sidebar?: ReactNode;
  showSubscribe?: boolean;
};

function renderContentBlock(block: TextContentBlock, index: number) {
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

function DefaultSidebar() {
  return (
    <div className={styles.ctaCard}>
      <h2 className={styles.sidebarTitle}>Нужно коммерческое предложение?</h2>
      <p>Оставьте заявку — подготовим условия поставок под ваш формат бизнеса.</p>
      <a className={styles.ctaButton} href="/#contacts">
        Оставить заявку
      </a>
    </div>
  );
}

export function TextArticleLayout({
  activeLink,
  breadcrumbs,
  tag,
  date,
  dateTime,
  title,
  description,
  content,
  image,
  backLink,
  sidebar,
  showSubscribe = true,
}: TextArticleLayoutProps) {
  return (
    <main className={homeStyles.page}>
      <Header activeLink={activeLink} static />

      <Breadcrumbs items={breadcrumbs} />

      <section className={styles.section} aria-labelledby="article-title">
        <div className={homeStyles.shell}>
          <div className={styles.layout}>
            <article className={styles.article}>
              <header>
                <div className={styles.meta}>
                  <span className={styles.tag}>{tag}</span>
                  <time className={styles.date} dateTime={dateTime}>
                    {date}
                  </time>
                </div>
                <h1 className={styles.title} id="article-title">
                  {title}
                </h1>
                <p className={styles.lead}>{description}</p>
              </header>

              {image ? (
                <figure className={styles.cover}>
                  <img alt="" height={520} src={image} width={1200} />
                </figure>
              ) : null}

              <div className={`${styles.content} ${image ? "" : styles.contentNoCover}`}>
                {content.map((block, index) => renderContentBlock(block, index))}
              </div>

              {backLink ? (
                <a className={styles.backLink} href={backLink.href}>
                  {backLink.label}
                </a>
              ) : null}
            </article>

            <aside className={styles.sidebar} aria-label="Дополнительные материалы">
              {sidebar ?? <DefaultSidebar />}
            </aside>
          </div>
        </div>
      </section>

      {showSubscribe ? <SubscribeSection /> : null}
      <Footer />
    </main>
  );
}
