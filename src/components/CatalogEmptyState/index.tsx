import Link from "next/link";

import homeStyles from "@/app/home.module.css";

import styles from "./CatalogEmptyState.module.css";

type CatalogEmptyStateProps = {
  categoryName: string;
};

export function CatalogEmptyState({ categoryName }: CatalogEmptyStateProps) {
  return (
    <section className={styles.section} aria-labelledby="empty-catalog-title">
      <div className={homeStyles.shell}>
        <div className={styles.card} role="status">
          <p className={styles.eyebrow}>Ассортимент обновляется</p>
          <h2 id="empty-catalog-title">{categoryName} скоро появится в каталоге</h2>
          <p>
            Мы добавляем позиции по мере подтверждения наличия. Оставьте заявку — подберём
            актуальный ассортимент под ваш формат бизнеса.
          </p>
          <div className={styles.actions}>
            <Link className={styles.primary} href="/#contacts">
              Оставить заявку
            </Link>
            <Link className={styles.secondary} href="/catalog/meat">
              Смотреть мясо
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
