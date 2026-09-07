import { listCmsHistory, loadCmsSnapshot } from "@/lib/cms/store";

import { restoreCmsRevision } from "../cms-actions";
import styles from "../../admin.module.css";

type BackupsPageProps = {
  searchParams: Promise<{ error?: string; restored?: string }>;
};

export default async function BackupsPage({ searchParams }: BackupsPageProps) {
  const [history, current, query] = await Promise.all([
    listCmsHistory(50),
    loadCmsSnapshot(),
    searchParams,
  ]);

  return (
    <main className={styles.content}>
      <header className={styles.pageHeader}>
        <div>
          <h1>История и копии</h1>
          <p>Каждое сохранение остаётся отдельной неизменяемой ревизией.</p>
        </div>
        <a
          className={styles.secondaryLink}
          href={`/api/genlix-admin/backups/${current.snapshot.revision}`}
        >
          Скачать текущую копию
        </a>
      </header>

      {query.error ? <p className={styles.alert}>{query.error}</p> : null}
      {query.restored ? (
        <p className={styles.successAlert}>
          Содержимое ревизии {query.restored} восстановлено как новая версия.
        </p>
      ) : null}

      <section className={styles.panel}>
        <h2>Безопасное восстановление</h2>
        <p>
          Восстановление не стирает историю: выбранная копия станет новой ревизией, а текущее
          состояние также останется доступным.
        </p>
      </section>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Ревизия</th>
              <th>Дата</th>
              <th>Автор</th>
              <th>Причина</th>
              <th aria-label="Действия" />
            </tr>
          </thead>
          <tbody>
            {history.map((entry) => (
              <tr key={entry.revision}>
                <td>
                  <strong>#{entry.revision}</strong>
                  {entry.revision === current.snapshot.revision ? (
                    <span className={styles.currentBadge}>Текущая</span>
                  ) : null}
                </td>
                <td>{new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(new Date(entry.createdAt))}</td>
                <td>{entry.actor}</td>
                <td>{entry.reason || "—"}</td>
                <td>
                  <div className={styles.historyActions}>
                    <a className={styles.actionLink} href={`/api/genlix-admin/backups/${entry.revision}`}>
                      Скачать
                    </a>
                    {entry.revision > 0 &&
                    entry.revision !== current.snapshot.revision &&
                    current.writable ? (
                      <form action={restoreCmsRevision}>
                        <input
                          name="expectedCurrentRevision"
                          type="hidden"
                          value={current.snapshot.revision}
                        />
                        <input name="targetRevision" type="hidden" value={entry.revision} />
                        <label>
                          <span>
                            Для подтверждения введите текущую ревизию {current.snapshot.revision}
                          </span>
                          <input
                            inputMode="numeric"
                            name="confirmation"
                            pattern="[0-9]+"
                            required
                            type="text"
                          />
                        </label>
                        <button type="submit">Восстановить</button>
                      </form>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
