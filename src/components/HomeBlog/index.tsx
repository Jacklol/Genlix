import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { getPublishedNewsArticles } from "@/lib/cms/repository";
import styles from "@/app/home.module.css";

function getNewsGridClass(index: number) {
  const pattern = index % 4;
  return pattern === 0 || pattern === 3 ? styles.newsGridWide : styles.newsGridNarrow;
}

export async function HomeBlog() {
  const homeNews = (await getPublishedNewsArticles()).slice(0, 4);
  return (
      <section className={styles.newsSection} id="news" aria-labelledby="news-title">
        <div className={styles.shell}>
          <div className={styles.newsHeading}>
            <Reveal variant="fade-up">
              <div className={styles.headingBlock}><p>Блог</p><h2 id="news-title">События индустрии <span>и опыт компании</span></h2></div>
            </Reveal>
            <Link className={styles.outlineButton} href="/news">Перейти в блог</Link>
          </div>
          <div className={styles.newsGrid} id="news-grid">
            {homeNews.map((item, index) => (
              <Reveal
                className={getNewsGridClass(index)}
                delay={index * 100}
                key={item.slug}
                variant="fade-up"
              >
                <a
                  className={styles.newsCard}
                  href={item.href}
                >
                  <Image className={styles.newsImage} src={item.image} alt="" fill sizes="(max-width: 920px) 100vw, 66vw" loading="lazy" />
                  <span className={styles.newsShade} />
                  <div>
                    <span>{item.tag}</span>
                    <h3>{item.title}</h3>
                  </div>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
  );
}

export function HomeBlogPlaceholder() {
  return <section className={styles.newsSection} id="news" aria-busy="true" aria-label="Блог загружается">
    <div className={styles.shell}><div className={styles.newsHeading}><div className={styles.headingBlock}><p>Блог</p><h2>События индустрии <span>и опыт компании</span></h2></div></div>
      <div className={styles.newsGrid} aria-hidden="true">{[0, 1, 2, 3].map((index) => <div key={index} className={getNewsGridClass(index)} style={{background: "var(--surface-dark)"}} />)}</div>
    </div>
  </section>;
}
