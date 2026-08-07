import type { CSSProperties } from "react";

import homeStyles from "@/app/home.module.css";

import styles from "./CatalogProductsSection.module.css";

export type CatalogProduct = {
  name: string;
  meta: string;
  image: string;
  href?: string;
};

type CatalogProductsSectionProps = {
  title: string;
  subtitle: string;
  products: CatalogProduct[];
  variant?: "dark" | "light";
  linkLabel?: string;
  linkHref?: string;
};

export function CatalogProductsSection({
  title,
  subtitle,
  products,
  variant = "light",
  linkLabel = "Смотреть весь опт",
  linkHref = "/#contacts",
}: CatalogProductsSectionProps) {
  const columnsClass = products.length <= 3 ? styles.cols3 : styles.cols4;

  return (
    <section
      className={`${styles.section} ${variant === "dark" ? styles.dark : styles.light}`}
      aria-label={title}
    >
      <div className={homeStyles.shell}>
        <div className={styles.header}>
          <div className={styles.copy}>
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.subtitle}>{subtitle}</p>
          </div>
          <a className={styles.link} href={linkHref}>
            {linkLabel}
          </a>
        </div>

        <div className={`${styles.grid} ${columnsClass}`}>
          {products.map((product) => {
            const cardContent = (
              <>
                <div className={styles.image} aria-hidden="true" />
                <div className={styles.body}>
                  <h3 className={styles.name}>{product.name}</h3>
                  <p className={styles.meta}>{product.meta}</p>
                </div>
              </>
            );

            return product.href ? (
              <a
                className={styles.card}
                href={product.href}
                key={`${product.name}-${product.image}`}
                style={{ "--card-image": `url("${product.image}")` } as CSSProperties}
              >
                {cardContent}
              </a>
            ) : (
              <article
                className={styles.card}
                key={`${product.name}-${product.image}`}
                style={{ "--card-image": `url("${product.image}")` } as CSSProperties}
              >
                {cardContent}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
