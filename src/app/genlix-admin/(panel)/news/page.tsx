import Link from "next/link";

import { AdminImage } from "@/components/AdminImage";
import { loadAdminCmsSnapshot } from "@/lib/cms/store";

import { AdminDataUnavailable } from "../AdminDataNotice";
import styles from "../../admin.module.css";

const dateFormat = new Intl.DateTimeFormat("ru-RU");

export default async function AdminNewsPage() {
  const cms = await loadAdminCmsSnapshot();
  if (!cms) return <AdminDataUnavailable title="Блог" />;
  const { snapshot } = cms;
  const articles = [...snapshot.content.news].sort((left, right) => {
    const leftDate = left.draft?.publishedAt ?? left.published?.publishedAt ?? left.updatedAt;
    const rightDate = right.draft?.publishedAt ?? right.published?.publishedAt ?? right.updatedAt;
    return Date.parse(rightDate) - Date.parse(leftDate);
  });

  return (
    <main className={styles.content}>
      <header className={styles.pageHeader}>
        <div>
          <h1>Блог</h1>
          <p>{articles.length} материалов, включая черновики и архив.</p>
        </div>
        <Link className={styles.primaryLink} href="/genlix-admin/news/new">
          + Добавить статью
        </Link>
      </header>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Материал</th>
              <th>Категория</th>
              <th>Состояние</th>
              <th>Дата</th>
              <th aria-label="Действия" />
            </tr>
          </thead>
          <tbody>
            {articles.map((entity) => {
              const payload = entity.draft ?? entity.published;
              if (!payload) return null;

              return (
                <tr key={entity.id}>
                  <td>
                    <div className={styles.itemCell}>
                      <AdminImage className={styles.thumb} src={payload.image} />
                      <span>
                        <strong>{payload.title}</strong>
                        <small>/{entity.slug}</small>
                      </span>
                    </div>
                  </td>
                  <td>{payload.tag}</td>
                  <td>
                    <span className={entity.status === "archived" ? styles.statusArchived : entity.draft ? styles.statusDraft : styles.statusOk}>
                      {entity.status === "archived"
                        ? "Архив"
                        : entity.status === "draft"
                          ? "Черновик"
                          : entity.draft
                            ? "Опубликована + черновик"
                            : "Опубликована"}
                    </span>
                  </td>
                  <td>{dateFormat.format(new Date(payload.publishedAt))}</td>
                  <td>
                    <Link className={styles.actionLink} href={`/genlix-admin/news/${encodeURIComponent(entity.id)}`} prefetch={false}>
                      Редактировать
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
