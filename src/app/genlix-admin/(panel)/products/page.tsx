import Link from "next/link";

import { loadCmsSnapshot } from "@/lib/cms/store";
import { categoryLabels } from "@/lib/catalog/category-fields";

import styles from "../../admin.module.css";

function statusLabel(status: string, hasDraft: boolean) {
  if (status === "archived") return "Архив";
  if (status === "draft") return "Черновик";
  return hasDraft ? "Опубликован + черновик" : "Опубликован";
}

export default async function AdminProductsPage() {
  const { snapshot } = await loadCmsSnapshot();
  const products = [...snapshot.content.products].sort(
    (left, right) => left.sortOrder - right.sortOrder,
  );

  return (
    <main className={styles.content}>
      <header className={styles.pageHeader}>
        <div>
          <h1>Товары</h1>
          <p>{products.length} позиций, включая черновики и архив.</p>
        </div>
        <Link className={styles.primaryLink} href="/genlix-admin/products/new">
          + Добавить товар
        </Link>
      </header>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Товар</th>
              <th>Раздел</th>
              <th>Состояние</th>
              <th>Обновлён</th>
              <th aria-label="Действия" />
            </tr>
          </thead>
          <tbody>
            {products.map((entity) => {
              const payload = entity.draft ?? entity.published;
              if (!payload) return null;

              return (
                <tr key={entity.id}>
                  <td>
                    <div className={styles.itemCell}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img alt="" className={styles.thumb} src={payload.catalog.image} />
                      <span>
                        <strong>{payload.catalog.title}</strong>
                        <small>{payload.catalog.brand} · /{entity.slug}</small>
                      </span>
                    </div>
                  </td>
                  <td>{categoryLabels[payload.category]}</td>
                  <td>
                    <span className={entity.status === "archived" ? styles.statusArchived : entity.draft ? styles.statusDraft : styles.statusOk}>
                      {statusLabel(entity.status, Boolean(entity.draft && entity.published))}
                    </span>
                  </td>
                  <td>{new Intl.DateTimeFormat("ru-RU").format(new Date(entity.updatedAt))}</td>
                  <td>
                    <Link className={styles.actionLink} href={`/genlix-admin/products/${encodeURIComponent(entity.id)}`}>
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
