import type { ProductDetailData } from "@/lib/products";
import homeStyles from "@/app/home.module.css";

import { ProductDetailGallery } from "@/components/ProductDetailGallery";

import styles from "./ProductDetailHero.module.css";

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

type ProductDetailHeroProps = {
  product: ProductDetailData;
};

export function ProductDetailHero({ product }: ProductDetailHeroProps) {
  return (
    <section className={styles.section} aria-labelledby="product-detail-title">
      <div className={homeStyles.shell}>
        <div className={styles.layout}>
          <ProductDetailGallery images={product.images} title={product.title} />

          <div className={styles.info}>
            <div className={styles.metaRow}>
              <span className={styles.brand}>{product.brand}</span>
              <span className={styles.category}>Категория: {product.category}</span>
            </div>

            <h1 className={styles.title} id="product-detail-title">
              {product.title}
            </h1>
            <p className={styles.packaging}>Фасовка: {product.packaging}</p>
            <p className={styles.description}>{product.description}</p>

            <div className={styles.divider} />

            <div className={styles.specs}>
              <p className={styles.spec}>
                <strong>Срок годности:</strong> {product.shelfLife}
              </p>
              <p className={styles.spec}>
                <strong>Условия хранения:</strong> {product.storage}
              </p>
            </div>

            <p className={styles.cookingTitle}>Способ приготовления</p>
            <div className={styles.tags}>
              {product.cookingMethods.map((method) => (
                <span className={styles.tag} key={method}>
                  {method}
                </span>
              ))}
            </div>

            {product.beerRecommendationLabel ? (
              <div className={styles.recommendation}>
                <BeerIcon />
                <a className={styles.recommendationLink} href="/catalog/beer">
                  {product.beerRecommendationLabel}
                </a>
              </div>
            ) : null}

            <a
              className={styles.button}
              href={product.buttonHref ?? "/#contacts"}
            >
              {product.buttonLabel ?? "Запросить поставку"}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
