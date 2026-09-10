import styles from "@/app/home.module.css";

export function HeroActions() {
  return <div className={`${styles.heroActions} ${styles.heroReveal}`} style={{ animationDelay: "560ms" }}>
    <a className={styles.primaryButton} href="#contacts">Стать партнёром</a>
    <a className={styles.secondaryButton} href="#catalog">Перейти в каталог</a>
  </div>;
}
