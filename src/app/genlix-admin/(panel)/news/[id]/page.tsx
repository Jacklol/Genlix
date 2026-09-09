import { notFound } from "next/navigation";

import { AdminNewsForm } from "@/components/AdminNewsForm";
import { loadCmsSnapshot } from "@/lib/cms/store";

import styles from "../../../admin.module.css";

type EditNewsPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export default async function EditNewsPage({ params, searchParams }: EditNewsPageProps) {
  const [{ id }, query, { snapshot }] = await Promise.all([
    params,
    searchParams,
    loadCmsSnapshot(),
  ]);
  const decodedId = decodeURIComponent(id);
  const entity = snapshot.content.news.find((item) => item.id === decodedId);

  if (!entity) notFound();
  const payload = entity.draft ?? entity.published;

  return (
    <main className={styles.content}>
      <header className={styles.pageHeader}>
        <div>
          <h1>{payload?.title ?? "Статья блога"}</h1>
          <p>Редактирование материала и обложки.</p>
        </div>
        {entity.published && entity.status !== "archived" ? (
          <a className={styles.secondaryLink} href={`/news/${entity.slug}`} target="_blank">
            Открыть на сайте ↗
          </a>
        ) : null}
      </header>
      <AdminNewsForm
        entity={entity}
        error={query.error}
        revision={snapshot.revision}
        saved={query.saved}
      />
    </main>
  );
}
