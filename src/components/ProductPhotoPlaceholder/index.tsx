import styles from "./ProductPhotoPlaceholder.module.css";

export function ProductPhotoPlaceholder({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`${styles.placeholder} ${compact ? styles.compact : ""}`} role="img" aria-label="Фото пока не добавлено">
      <svg aria-hidden="true" width="36" height="36" viewBox="0 0 36 36" fill="none">
        <rect x="5" y="5" width="26" height="26" rx="4" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="13" cy="13" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="m6 26 8-8 5 5 4-4 7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {!compact ? <span aria-hidden="true">Фото пока не добавлено</span> : null}
    </span>
  );
}
