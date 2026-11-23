import { AdminNewsForm } from "@/components/AdminNewsForm";
import { loadAdminCmsSnapshot } from "@/lib/cms/store";

import { AdminDataUnavailable } from "../../AdminDataNotice";
import styles from "../../../admin.module.css";

type NewNewsPageProps = {
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export default async function NewNewsPage({ searchParams }: NewNewsPageProps) {
  const [cms, query] = await Promise.all([loadAdminCmsSnapshot(), searchParams]);
  if (!cms) return <AdminDataUnavailable title="Новая статья" />;

  return (
    <main className={styles.content}>
      <header className={styles.pageHeader}>
        <div>
          <h1>Новая статья</h1>
          <p>Материал можно сохранить черновиком и опубликовать позже.</p>
        </div>
      </header>
      <AdminNewsForm error={query.error} revision={cms.snapshot.revision} saved={query.saved} />
    </main>
  );
}
