import homeStyles from "@/app/home.module.css";
import { Header } from "@/components/Header";

import styles from "./catalog-state.module.css";

export default function CatalogLoading() {
  return (
    <main className={homeStyles.page} aria-busy="true" aria-label="Загружаем каталог">
      <Header activeLink="Каталог" static />

      <div className={styles.loadingBreadcrumb}>
        <div className={homeStyles.shell}>
          <span className={styles.shimmer} />
        </div>
      </div>

      <section className={styles.loadingHero}>
        <div className={homeStyles.shell}>
          <span className={`${styles.shimmer} ${styles.loadingEyebrow}`} />
          <span className={`${styles.shimmer} ${styles.loadingTitle}`} />
          <span className={`${styles.shimmer} ${styles.loadingCopy}`} />
        </div>
      </section>

      <section className={styles.loadingProducts}>
        <div className={homeStyles.shell}>
          <p>Загружаем актуальный ассортимент…</p>
          <div className={styles.loadingGrid} aria-hidden="true">
            {Array.from({ length: 3 }, (_, index) => (
              <span className={`${styles.shimmer} ${styles.loadingCard}`} key={index} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
