import { AdminProductForm } from "@/components/AdminProductForm";
import { loadAdminCmsSnapshot } from "@/lib/cms/store";

import { AdminDataUnavailable } from "../../AdminDataNotice";
import styles from "../../../admin.module.css";

type NewProductPageProps = {
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export default async function NewProductPage({ searchParams }: NewProductPageProps) {
  const [cms, query] = await Promise.all([
    loadAdminCmsSnapshot(),
    searchParams,
  ]);
  if (!cms) return <AdminDataUnavailable title="Новый товар" />;
  const { snapshot, writable, warning } = cms;

  return (
    <main className={styles.content}>
      <header className={styles.pageHeader}>
        <div>
          <h1>Новый товар</h1>
          <p>Сначала можно сохранить черновик и проверить все поля.</p>
        </div>
      </header>
      {writable ? (
        <AdminProductForm error={query.error} revision={snapshot.revision} saved={query.saved} />
      ) : <p className={styles.alert}>{warning ?? "Создание товара временно недоступно."}</p>}
    </main>
  );
}
