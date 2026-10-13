import Link from "next/link";
import { AdminProductImport } from "@/components/AdminProductImport";
import { loadCmsSnapshot } from "@/lib/cms/store";
import styles from "../../../admin.module.css";

export default async function ProductImportPage() {
  const { writable, warning } = await loadCmsSnapshot();
  return <main className={styles.content}>
    <header className={styles.pageHeader}>
      <div><h1>Товары из Excel</h1><p>Заполните шаблон, проверьте изменения и примените импорт.</p></div>
      <Link className={styles.actionLink} href="/genlix-admin/products">К списку товаров</Link>
    </header>
    <AdminProductImport writable={writable} warning={warning} />
  </main>;
}
