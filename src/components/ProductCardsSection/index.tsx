import homeStyles from "@/app/home.module.css";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";

import styles from "./ProductCardsSection.module.css";

type ProductCardsSectionProps = {
  products: ProductCardData[];
};

export function ProductCardsSection({ products }: ProductCardsSectionProps) {
  return (
    <section className={styles.section} aria-label="Каталог продукции">
      <div className={homeStyles.shell}>
        <div className={styles.grid}>
          {products.map((product) => (
            <ProductCard key={`${product.title}-${product.image}`} {...product} />
          ))}
        </div>
      </div>
    </section>
  );
}
