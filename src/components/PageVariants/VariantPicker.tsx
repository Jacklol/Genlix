"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { VariantChoice, VariantPage } from "./routes";
import styles from "./PageVariants.module.css";

export function VariantPicker({ page, value, choices }: { page: VariantPage; value: string; choices: readonly VariantChoice[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState("");
  const [manual, setManual] = useState("");
  const message = copied === value ? "Ссылка скопирована" : "";
  const variantHref = (variant: string) => `/${page}?variant=${encodeURIComponent(variant)}`;
  const index = choices.findIndex((choice) => choice.value === value);
  const previous = choices[(index + choices.length - 1) % choices.length];
  const next = choices[(index + 1) % choices.length];

  function showPageStart() {
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  async function copy() {
    const url = new URL(variantHref(value), location.origin).href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(value);
    } catch {
      setManual(value);
    }
  }

  return (
    <nav className={styles.picker} aria-label="Выбор оформления страницы">
      <div className={styles.pickerInner}>
        <label className={styles.selectLabel}>
          <span>Вариант страницы</span>
          <select
            aria-label="Вариант страницы"
            value={value}
            aria-busy={pending}
            onChange={(event) => {
              const href = variantHref(event.target.value);
              showPageStart();
              startTransition(() => router.push(href, { scroll: false }));
            }}
          >
            {choices.map((choice) => <option key={choice.value} value={choice.value}>{choice.label}</option>)}
          </select>
        </label>
        <div className={styles.pickerActions}>
          <Link href={variantHref(previous.value)} prefetch={false} scroll={false} onNavigate={showPageStart} aria-label="Предыдущий вариант">‹</Link>
          <Link href={variantHref(next.value)} prefetch={false} scroll={false} onNavigate={showPageStart} aria-label="Следующий вариант">›</Link>
          <button type="button" onClick={copy}>{message || "Копировать ссылку"}</button>
          <Link href={page === "contacts" ? "/about" : "/contacts"} prefetch={false} className={styles.otherPage}>
            {page === "contacts" ? "О компании" : "Контакты"}
          </Link>
        </div>
        {manual === value && <input aria-label="Ссылка на вариант" value={new URL(variantHref(value), location.origin).href} readOnly onFocus={(event) => event.target.select()} />}
        <span className={styles.srOnly} role="status">{pending ? "Открываем вариант" : message}</span>
      </div>
    </nav>
  );
}
