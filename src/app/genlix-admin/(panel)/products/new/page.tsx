import { AdminProductForm } from "@/components/AdminProductForm";
import { loadCmsSnapshot } from "@/lib/cms/store";

import styles from "../../../admin.module.css";

type NewProductPageProps = {
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export default async function NewProductPage({ searchParams }: NewProductPageProps) {
  const [{ snapshot }, query] = await Promise.all([loadCmsSnapshot(), searchParams]);

  return (
    <main className={styles.content}>
      <header className={styles.pageHeader}>
        <div>
          <h1>Новый товар</h1>
          <p>Сначала можно сохранить черновик и проверить все поля.</p>
        </div>
      </header>
      <AdminProductForm error={query.error} revision={snapshot.revision} saved={query.saved} />
    </main>
  );
}
