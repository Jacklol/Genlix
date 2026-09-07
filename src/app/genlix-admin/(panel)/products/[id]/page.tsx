import { notFound } from "next/navigation";

import { AdminProductForm } from "@/components/AdminProductForm";
import { loadCmsSnapshot } from "@/lib/cms/store";

import styles from "../../../admin.module.css";

type EditProductPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export default async function EditProductPage({ params, searchParams }: EditProductPageProps) {
  const [{ id }, query, { snapshot }] = await Promise.all([
    params,
    searchParams,
    loadCmsSnapshot(),
  ]);
  const decodedId = decodeURIComponent(id);
  const entity = snapshot.content.products.find((product) => product.id === decodedId);

  if (!entity) notFound();
  const payload = entity.draft ?? entity.published;

  return (
    <main className={styles.content}>
      <header className={styles.pageHeader}>
        <div>
          <h1>{payload?.catalog.title ?? "Товар"}</h1>
          <p>Редактирование карточки и параметров фильтрации.</p>
        </div>
        {entity.published && entity.status !== "archived" ? (
          <a className={styles.secondaryLink} href={`/catalog/product/${entity.slug}`} target="_blank">
            Открыть на сайте ↗
          </a>
        ) : null}
      </header>
      <AdminProductForm
        entity={entity}
        error={query.error}
        revision={snapshot.revision}
        saved={query.saved}
      />
    </main>
  );
}
