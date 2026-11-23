import Form from "next/form";
import Link from "next/link";

import { loadAdminCmsSnapshot } from "@/lib/cms/store";
import { categoryLabels } from "@/lib/catalog/category-fields";
import { AdminImage } from "@/components/AdminImage";

import { AdminDataUnavailable } from "../AdminDataNotice";
import styles from "../../admin.module.css";

const productsPath = "/genlix-admin/products";
const pageSize = 25;
const dateFormat = new Intl.DateTimeFormat("ru-RU");

function normalizeSearch(value: string) {
  return value.toLowerCase().replaceAll("ё", "е");
}

function pageHref(page: number, query: string) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));
  return params.size ? `${productsPath}?${params}` : productsPath;
}

function statusLabel(status: string, hasDraft: boolean) {
  if (status === "archived") return "Архив";
  if (status === "draft") return "Черновик";
  return hasDraft ? "Опубликован + черновик" : "Опубликован";
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>;
}) {
  const [cms, params] = await Promise.all([
    loadAdminCmsSnapshot(),
    searchParams,
  ]);
  if (!cms) return <AdminDataUnavailable title="Товары" />;
  const { snapshot, writable, warning } = cms;
  const query = typeof params.q === "string" ? params.q.slice(0, 120).trim() : "";
  const terms = query ? normalizeSearch(query).split(/\s+/) : [];
  const products = [...snapshot.content.products].sort(
    (left, right) => left.sortOrder - right.sortOrder,
  );
  const filtered = products.flatMap((entity) => {
    const payload = entity.draft ?? entity.published;
    if (!payload) return [];

    if (terms.length) {
      const { title, brand, specs } = payload.catalog;
      const article = specs.find((spec) => spec.label === "Артикул")?.value ?? "";
      const searchable = normalizeSearch(`${title} ${brand} ${article} ${entity.slug}`);
      if (!terms.every((term) => searchable.includes(term))) return [];
    }

    return [{ entity, payload }];
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const requestedPage = typeof params.page === "string" && /^\d+$/.test(params.page) ? Number(params.page) : 1;
  const page = Math.min(pageCount, Math.max(1, requestedPage));
  const offset = (page - 1) * pageSize;
  const visibleProducts = filtered.slice(offset, offset + pageSize);

  return (
    <main className={styles.content}>
      <header className={styles.pageHeader}>
        <div>
          <h1>Товары</h1>
          <p>{products.length} позиций, включая черновики и архив.</p>
        </div>
        {writable ? <div className={styles.inlineActions}>
          <Link className={styles.primaryLink} href={`${productsPath}/import`}>Импорт Excel</Link>
          <Link className={styles.primaryLink} href={`${productsPath}/new`}>+ Добавить товар</Link>
        </div> : null}
      </header>

      {warning ? <p className={styles.alert}>{warning}</p> : null}

      <Form action={productsPath} className={styles.productSearch} prefetch={false}>
        <label className={styles.field}>
          Поиск товаров
          <input key={query} type="search" name="q" defaultValue={query} maxLength={120} placeholder="Название, бренд или артикул" />
        </label>
        <button className={styles.secondaryLink} type="submit">Найти</button>
        {query ? <Link className={styles.secondaryLink} href={productsPath} prefetch={false}>Сбросить</Link> : null}
      </Form>
      <p className={styles.productCount}>
        {visibleProducts.length
          ? `Показано ${offset + 1}–${offset + visibleProducts.length} из ${filtered.length}`
          : "Найдено товаров: 0"}
      </p>

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
            {visibleProducts.length === 0 ? (
              <tr><td className={styles.emptyTableCell} colSpan={5}>{query ? "По вашему запросу ничего не найдено." : "Товаров пока нет."}</td></tr>
            ) : visibleProducts.map(({ entity, payload }) => (
              <tr key={entity.id}>
                <td>
                  <div className={styles.itemCell}>
                    <AdminImage className={styles.thumb} src={payload.catalog.image} />
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
                <td>{dateFormat.format(new Date(entity.updatedAt))}</td>
                <td>
                  {writable ? <Link className={styles.actionLink} href={`${productsPath}/${encodeURIComponent(entity.id)}`} prefetch={false}>
                    Редактировать
                  </Link> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pageCount > 1 ? (
        <nav className={styles.pagination} aria-label="Страницы товаров">
          {page > 1 ? (
            <Link className={styles.secondaryLink} href={pageHref(page - 1, query)} prefetch={false}>Назад</Link>
          ) : <span className={styles.secondaryLink} aria-disabled="true">Назад</span>}
          <span>Страница {page} из {pageCount}</span>
          {page < pageCount ? (
            <Link className={styles.secondaryLink} href={pageHref(page + 1, query)} prefetch={false}>Далее</Link>
          ) : <span className={styles.secondaryLink} aria-disabled="true">Далее</span>}
        </nav>
      ) : null}
    </main>
  );
}
