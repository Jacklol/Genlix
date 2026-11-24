import styles from "@/app/home.module.css";

export function HeroActions({ immediate = false }: { immediate?: boolean }) {
  return (
    <div
      className={immediate ? styles.heroActions : `${styles.heroActions} ${styles.heroReveal}`}
      style={immediate ? undefined : { animationDelay: "560ms" }}
    >
      <a className={styles.primaryButton} href="#contacts">Стать партнёром</a>
      <a className={styles.secondaryButton} href="#catalog">Перейти в каталог</a>
    </div>
  );
}
