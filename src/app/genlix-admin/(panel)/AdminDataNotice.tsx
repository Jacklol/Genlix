"use client";

import { useState } from "react";

import styles from "../admin.module.css";

function AdminDataNotice({ message }: { message: string }) {
  const [retrying, setRetrying] = useState(false);

  return (
    <div className={`${styles.alert} ${styles.dataNotice}`}>
      <p role="status">{message}</p>
      <button
        className={styles.secondaryLink}
        disabled={retrying}
        type="button"
        onClick={() => {
          setRetrying(true);
          window.location.reload();
        }}
      >
        {retrying ? "Проверяем…" : "Повторить"}
      </button>
    </div>
  );
}

export function AdminDataUnavailable({
  title,
  message = "База данных не отвечает. Повторите попытку.",
}: { title: string; message?: string }) {
  return (
    <main className={styles.content}>
      <header className={styles.pageHeader}><h1>{title}</h1></header>
      <AdminDataNotice message={message} />
    </main>
  );
}
