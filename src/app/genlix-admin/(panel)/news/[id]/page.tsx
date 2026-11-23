import { notFound } from "next/navigation";

import { AdminNewsForm } from "@/components/AdminNewsForm";
import { AdminSiteLink } from "@/components/AdminSiteLink";
import { loadAdminCmsSnapshot } from "@/lib/cms/store";

import { AdminDataUnavailable } from "../../AdminDataNotice";
import styles from "../../../admin.module.css";

type EditNewsPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export default async function EditNewsPage({ params, searchParams }: EditNewsPageProps) {
  const [{ id }, query, cms] = await Promise.all([
    params,
    searchParams,
    loadAdminCmsSnapshot(),
  ]);
  if (!cms) return <AdminDataUnavailable title="Статья блога" />;
  const { snapshot } = cms;
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
          <AdminSiteLink href={`/news/${entity.slug}`} />
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
