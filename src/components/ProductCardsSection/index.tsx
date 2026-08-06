import homeStyles from "@/app/home.module.css";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";

import styles from "./ProductCardsSection.module.css";

type ProductCardsSectionProps = {
  products: ProductCardData[];
  title?: string;
  variant?: "light" | "dark" | "muted";
  linkLabel?: string;
  linkHref?: string;
};

const variantClassNames = {
  light: styles.light,
  dark: styles.dark,
  muted: styles.muted,
} as const;

export function ProductCardsSection({
  products,
  title,
  variant = "light",
  linkLabel,
  linkHref = "/#contacts",
}: ProductCardsSectionProps) {
  const hasHeader = Boolean(title || linkLabel);

  return (
    <section
      className={`${styles.section} ${variantClassNames[variant]}`}
      aria-label={title ?? "Каталог продукции"}
    >
      <div className={homeStyles.shell}>
        {hasHeader ? (
          <div className={styles.header}>
            {title ? <h2 className={styles.title}>{title}</h2> : null}
            {linkLabel ? (
              <a className={styles.link} href={linkHref}>
                {linkLabel}
              </a>
            ) : null}
          </div>
        ) : null}

        <div className={styles.grid}>
          {products.map((product) => (
            <ProductCard key={`${product.title}-${product.image}`} {...product} />
          ))}
        </div>
      </div>
    </section>
  );
}
