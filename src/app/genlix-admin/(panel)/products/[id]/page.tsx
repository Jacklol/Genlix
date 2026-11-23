import { notFound } from "next/navigation";

import { AdminProductForm } from "@/components/AdminProductForm";
import { AdminSiteLink } from "@/components/AdminSiteLink";
import { loadAdminCmsSnapshot } from "@/lib/cms/store";

import { AdminDataUnavailable } from "../../AdminDataNotice";
import styles from "../../../admin.module.css";

type EditProductPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export default async function EditProductPage({ params, searchParams }: EditProductPageProps) {
  const [{ id }, query, cms] = await Promise.all([
    params,
    searchParams,
    loadAdminCmsSnapshot(),
  ]);
  if (!cms) return <AdminDataUnavailable title="Товар" />;
  const { snapshot, writable, warning } = cms;
  const decodedId = decodeURIComponent(id);
  const entity = snapshot.content.products.find((product) => product.id === decodedId);

  if (!entity && writable) notFound();
  const payload = entity?.draft ?? entity?.published;

  return (
    <main className={styles.content}>
      <header className={styles.pageHeader}>
        <div>
          <h1>{payload?.catalog.title ?? "Товар"}</h1>
          <p>Редактирование карточки и параметров фильтрации.</p>
        </div>
        {entity?.published && entity.status !== "archived" ? (
          <AdminSiteLink href={`/catalog/product/${entity.slug}`} />
        ) : null}
      </header>
      {writable && entity ? <AdminProductForm
        entity={entity}
        error={query.error}
        revision={snapshot.revision}
        saved={query.saved}
      /> : <p className={styles.alert}>{warning ?? "Редактирование временно недоступно."}</p>}
    </main>
  );
}
