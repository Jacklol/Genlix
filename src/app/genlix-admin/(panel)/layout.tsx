import type { ReactNode } from "react";
import Link from "next/link";

import { requireAdminSession } from "@/lib/admin/auth";

import { logoutAdmin } from "./actions";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

export default async function AdminPanelLayout({ children }: { children: ReactNode }) {
  const session = await requireAdminSession();

  return (
    <div className={styles.adminShell}>
      <aside className={styles.sidebar}>
        <Link className={styles.sidebarBrand} href="/genlix-admin">
          GENLIX <span>admin</span>
        </Link>
        <nav aria-label="Разделы управления">
          <Link href="/genlix-admin">Обзор</Link>
          <Link href="/genlix-admin/requests">Заявки</Link>
          <Link href="/genlix-admin/products">Товары</Link>
          <Link href="/genlix-admin/news">Блог</Link>
          <Link href="/genlix-admin/backups">История и копии</Link>
        </nav>
        <div className={styles.sidebarFooter}>
          <a href="/" target="_blank">
            Открыть сайт ↗
          </a>
          <form action={logoutAdmin}>
            <button type="submit">Выйти</button>
          </form>
        </div>
      </aside>

      <div className={styles.adminMain}>
        <header className={styles.topbar}>
          <strong>Панель управления</strong>
          <span>{session.username}</span>
        </header>
        {children}
      </div>
    </div>
  );
}
