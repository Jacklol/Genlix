"use client";

import Link from "next/link";

import homeStyles from "@/app/home.module.css";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

import styles from "./catalog-state.module.css";

type CatalogErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function CatalogError({ reset }: CatalogErrorProps) {
  return (
    <main className={homeStyles.page}>
      <Header activeLink="Каталог" static />

      <section className={styles.errorSection}>
        <div className={homeStyles.shell}>
          <div className={styles.errorCard}>
            <p>Каталог временно недоступен</p>
            <h1>Не удалось загрузить товары</h1>
            <span>
              Попробуйте ещё раз. Если соединение не восстановится, мы поможем подобрать
              ассортимент по заявке.
            </span>
            <div className={styles.errorActions}>
              <button onClick={reset} type="button">
                Попробовать снова
              </button>
              <Link href="/#contacts">Оставить заявку</Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
