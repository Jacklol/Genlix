import styles from "../admin.module.css";

export default function AdminLoading() {
  return (
    <main className={styles.content}>
      <div className={styles.panel} role="status">Открываем раздел…</div>
    </main>
  );
}
