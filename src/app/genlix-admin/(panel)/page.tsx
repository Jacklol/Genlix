import { getCmsBackendMode, loadCmsSnapshot } from "@/lib/cms/store";

import { initializeAdminCms } from "./cms-actions";
import styles from "../admin.module.css";

type AdminDashboardProps = {
  searchParams: Promise<{ error?: string; initialized?: string }>;
};

export default async function AdminDashboard({ searchParams }: AdminDashboardProps) {
  const [{ error, initialized }, cms] = await Promise.all([
    searchParams,
    loadCmsSnapshot(),
  ]);
  const backendMode = getCmsBackendMode();
  const products = cms.snapshot.content.products;
  const news = cms.snapshot.content.news;
  const publishedProducts = products.filter((item) => item.status === "published").length;
  const publishedNews = news.filter((item) => item.status === "published").length;
  const drafts = [...products, ...news].filter(
    (item) => item.status === "draft" || item.draft,
  ).length;

  return (
    <main className={styles.content}>
      <header className={styles.pageHeader}>
        <div>
          <h1>Обзор</h1>
          <p>Каталог и блог Genlix в одном защищённом разделе.</p>
        </div>
      </header>

      {error ? <p className={styles.alert}>{error}</p> : null}
      {initialized ? (
        <p className={styles.successAlert}>Исходные товары и статьи блога перенесены в базу.</p>
      ) : null}

      <div className={styles.statsGrid}>
        <article className={styles.statCard}>
          <span>Опубликовано товаров</span>
          <strong>{publishedProducts}</strong>
        </article>
        <article className={styles.statCard}>
          <span>Опубликовано статей в блоге</span>
          <strong>{publishedNews}</strong>
        </article>
        <article className={styles.statCard}>
          <span>Есть черновики</span>
          <strong>{drafts}</strong>
        </article>
      </div>

      <section className={styles.panel}>
        <h2>Состояние данных</h2>
        <p>
          Текущая ревизия: <strong>{cms.snapshot.revision}</strong>. Источник: {" "}
          <strong>
            {cms.mode === "supabase"
              ? "Supabase"
              : cms.mode === "local"
                ? "локальная тестовая база"
                : "резервная копия из кода"}
          </strong>
          .
        </p>
        {cms.writable ? (
          <span className={styles.statusOk}>Запись доступна</span>
        ) : (
          <span className={styles.statusWarning}>Только чтение</span>
        )}
        {cms.warning ? <p>{cms.warning}</p> : null}

        {backendMode === "supabase" && !cms.writable ? (
          <form action={initializeAdminCms} className={styles.initializeForm}>
            <button className={styles.primaryButton} type="submit">
              Перенести 24 товара и 8 статей блога в Supabase
            </button>
          </form>
        ) : null}
      </section>

      <section className={styles.panel}>
        <h2>Как защищены данные</h2>
        <p>
          Любое сохранение создаёт новую неизменяемую ревизию всего содержимого. Черновики не
          меняют публичный сайт, архивирование ничего не удаляет, а прежнюю версию можно скачать
          или восстановить в разделе «История и копии».
        </p>
      </section>
    </main>
  );
}
