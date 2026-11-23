import Link from "next/link";
import { AdminProductImport } from "@/components/AdminProductImport";
import { loadAdminCmsSnapshot } from "@/lib/cms/store";
import { AdminDataUnavailable } from "../../AdminDataNotice";
import styles from "../../../admin.module.css";

export default async function ProductImportPage() {
  const cms = await loadAdminCmsSnapshot();
  if (!cms) return <AdminDataUnavailable title="Товары из Excel" />;
  const { writable, warning } = cms;
  return <main className={styles.content}>
    <header className={styles.pageHeader}>
      <div><h1>Товары из Excel</h1><p>Заполните шаблон, проверьте изменения и примените импорт.</p></div>
      <Link className={styles.actionLink} href="/genlix-admin/products">К списку товаров</Link>
    </header>
    {!writable ? <p className={styles.alert}>{warning ?? "Импорт товаров временно недоступен."}</p> : null}
    <AdminProductImport writable={writable} />
  </main>;
}
