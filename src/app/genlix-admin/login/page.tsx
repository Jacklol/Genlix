import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getAdminAuthStatus, getAdminSession } from "@/lib/admin/auth";

import { loginAdmin } from "./actions";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: "Вход в управление — Genlix",
};

type AdminLoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

const errorMessages: Record<string, string> = {
  config: "Авторизация ещё не настроена на сервере. Проверьте переменные окружения.",
  credentials: "Неверный логин или пароль.",
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  if (await getAdminSession()) {
    redirect("/genlix-admin");
  }

  const { error } = await searchParams;
  const status = getAdminAuthStatus();
  const errorMessage = error ? errorMessages[error] : status.message;

  return (
    <main className={styles.loginPage}>
      <section className={styles.loginCard} aria-labelledby="admin-login-title">
        <Link className={styles.loginBrand} href="/">
          GENLIX
        </Link>
        <p className={styles.eyebrow}>Закрытый раздел</p>
        <h1 id="admin-login-title">Управление сайтом</h1>
        <p className={styles.loginLead}>
          Войдите, чтобы добавлять товары, редактировать каталог и публиковать новости.
        </p>

        {errorMessage ? (
          <p className={styles.alert} role="alert">
            {errorMessage}
          </p>
        ) : null}

        <form action={loginAdmin} className={styles.loginForm}>
          <label>
            <span>Логин</span>
            <input autoComplete="username" name="username" required />
          </label>
          <label>
            <span>Пароль</span>
            <input autoComplete="current-password" name="password" required type="password" />
          </label>
          <button disabled={!status.configured} type="submit">
            Войти
          </button>
        </form>

        {status.developmentDefaults ? (
          <p className={styles.devHint}>
            Локальный тестовый вход: <strong>admin / admin</strong>
          </p>
        ) : null}
      </section>
    </main>
  );
}
