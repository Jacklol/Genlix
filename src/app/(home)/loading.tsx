import styles from "@/app/home.module.css";

export default function HomeLoading() {
  return (
    <section id="catalog" className={styles.catalogSection} aria-busy="true" aria-label="Загружаем разделы главной">
      <div className={styles.shell}>
        <h2>Каталог продукции</h2>
      </div>
    </section>
  );
}
