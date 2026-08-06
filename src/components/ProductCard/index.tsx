import type { CSSProperties } from "react";

import styles from "./ProductCard.module.css";

export type ProductBadge = "хит" | "new" | "витрина" | "ферма";

export type ProductSpec = {
  label: string;
  value: string;
};

export type ProductCardData = {
  image: string;
  badge?: ProductBadge;
  brand?: string;
  title: string;
  specs: ProductSpec[];
  tags?: string[];
  recommendation?: string;
  buttonLabel?: string;
  buttonHref?: string;
};

const badgeStyles: Record<ProductBadge, { label: string; color: string }> = {
  хит: { label: "Хит", color: "#f2b43b" },
  new: { label: "New", color: "#2e7d32" },
  витрина: { label: "Витрина", color: "#1976d2" },
  ферма: { label: "Ферма", color: "#f2b43b" },
};

function BeerIcon() {
  return (
    <svg
      aria-hidden="true"
      className={styles.recommendationIcon}
      fill="none"
      height="14"
      viewBox="0 0 14 14"
      width="14"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9.91667 6.41668H10.5C10.9641 6.41668 11.4092 6.60107 11.7374 6.92928C12.0656 7.2575 12.25 7.70265 12.25 8.16682C12.25 8.63099 12.0656 9.07614 11.7374 9.40436C11.4092 9.73257 10.9641 9.91696 10.5 9.91696H9.91667M5.25 7.00006V10.5003M7.58333 7.00006V10.5003M2.91667 4.66654V11.6671C2.91667 11.9765 3.03958 12.2733 3.25838 12.4921C3.47717 12.7109 3.77391 12.8339 4.08333 12.8339H8.75C9.05942 12.8339 9.35616 12.7109 9.57496 12.4921C9.79375 12.2733 9.91667 11.9765 9.91667 11.6671V4.66654M8.16667 4.37485C7.58333 4.37485 7.32667 4.66654 6.41667 4.66654C5.50667 4.66654 5.25 4.37485 4.66667 4.37485C4.08333 4.37485 3.66333 4.66654 3.20833 4.66654C2.82156 4.66654 2.45063 4.51288 2.17714 4.23937C1.90365 3.96586 1.75 3.59489 1.75 3.20809C1.75 2.82128 1.90365 2.45032 2.17714 2.17681C2.45063 1.9033 2.82156 1.74964 3.20833 1.74964C3.66333 1.74964 4.12417 2.04133 4.66667 2.04133C5.20917 2.04133 5.50667 1.16626 6.41667 1.16626C7.32667 1.16626 7.58333 2.04133 8.16667 2.04133C8.75 2.04133 9.17 1.74964 9.625 1.74964C10.0118 1.74964 10.3827 1.9033 10.6562 2.17681C10.9297 2.45032 11.0833 2.82128 11.0833 3.20809C11.0833 3.59489 10.9297 3.96586 10.6562 4.23937C10.3827 4.51288 10.0118 4.66654 9.625 4.66654C9.17 4.66654 8.75 4.37485 8.16667 4.37485Z"
        stroke="currentColor"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ProductCard({
  image,
  badge,
  brand,
  title,
  specs,
  tags = [],
  recommendation,
  buttonLabel = "Запросить розничную поставку",
  buttonHref = "/#contacts",
}: ProductCardData) {
  const badgeData = badge ? badgeStyles[badge] : null;

  return (
    <article
      className={styles.card}
      style={{ "--product-image": `url("${image}")` } as CSSProperties}
    >
      <div className={styles.media}>
        {badgeData ? (
          <span className={styles.badge} style={{ backgroundColor: badgeData.color }}>
            {badgeData.label}
          </span>
        ) : null}
        {brand ? <span className={styles.brand}>{brand}</span> : null}
      </div>

      <div className={styles.body}>
        <h3 className={styles.title}>{title}</h3>

        <dl className={styles.specs}>
          {specs.map((spec) => (
            <div className={styles.spec} key={spec.label}>
              <dt>{spec.label}</dt>
              <dd>{spec.value}</dd>
            </div>
          ))}
        </dl>

        {tags.length > 0 ? (
          <div className={styles.tags}>
            {tags.map((tag) => (
              <span className={styles.tag} key={tag}>
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        {recommendation ? (
          <div className={styles.recommendation}>
            <BeerIcon />
            <span className={styles.recommendationText}>{recommendation}</span>
            <span aria-hidden="true" className={styles.recommendationChevron}>
              ⌄
            </span>
          </div>
        ) : null}

        <a className={styles.button} href={buttonHref}>
          {buttonLabel}
        </a>
      </div>
    </article>
  );
}
