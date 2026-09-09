import { AdminNewsForm } from "@/components/AdminNewsForm";
import { loadCmsSnapshot } from "@/lib/cms/store";

import styles from "../../../admin.module.css";

type NewNewsPageProps = {
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export default async function NewNewsPage({ searchParams }: NewNewsPageProps) {
  const [{ snapshot }, query] = await Promise.all([loadCmsSnapshot(), searchParams]);

  return (
    <main className={styles.content}>
      <header className={styles.pageHeader}>
        <div>
          <h1>Новая статья</h1>
          <p>Материал можно сохранить черновиком и опубликовать позже.</p>
        </div>
      </header>
      <AdminNewsForm error={query.error} revision={snapshot.revision} saved={query.saved} />
    </main>
  );
}
