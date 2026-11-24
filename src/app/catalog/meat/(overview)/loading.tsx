import homeStyles from "@/app/home.module.css";
import { CatalogFilterFields } from "@/components/CatalogFilterFields";
import { MeatCatalogLoadingHero } from "@/components/UnifiedMeatCatalogPage";
import catalog from "@/components/UnifiedMeatCatalog/UnifiedMeatCatalog.module.css";
import styles from "./loading.module.css";

export default function MeatCatalogLoading() {
  return (
    <div aria-busy="true" aria-label="Загружается ассортимент мяса">
      <MeatCatalogLoadingHero>
        <div className={`${catalog.darkFilters} ${catalog.imageFilters}`} aria-hidden="true">
          <div className={homeStyles.shell}>
            <div className={styles.mobileFilter} />
            <div className={`${catalog.filterPanel} ${styles.desktopFilters}`}>
              <CatalogFilterFields className={catalog.filterFields}>
                {Array.from({ length: 6 }, (_, i) => <span className={styles.control} key={i} />)}
              </CatalogFilterFields>
              <div className={catalog.filterActions}>
                <span className={styles.control} />
                <span className={styles.control} />
              </div>
            </div>
          </div>
        </div>
      </MeatCatalogLoadingHero>
      <section className={catalog.catalogSection} aria-hidden="true">
        <div className={homeStyles.shell}>
          <header className={catalog.catalogHeader}>
            <div>
              <p className={catalog.eyebrow}>Ассортимент</p>
              <h2>Каталог наших товаров</h2>
            </div>
          </header>
          <div className={catalog.grid}>
            {[0, 1, 2].map((i) => (
              <div className={styles.card} key={i}>
                <div className={styles.image} />
                <div className={styles.line} />
                <div className={styles.shortLine} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
