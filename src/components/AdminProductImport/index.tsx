"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PRODUCT_IMPORT_MAX_BYTES, type ProductImportMode, type ProductImportPreview } from "@/lib/cms/product-spreadsheet-fields";
import admin from "@/app/genlix-admin/admin.module.css";
import styles from "./AdminProductImport.module.css";

const changeLabels = { create: "Новый товар", update: "Заменить данные", publish: "Опубликовать", unchanged: "Без изменений", archive: "В архив" };

export function AdminProductImport({ writable, warning }: { writable: boolean; warning?: string }) {
  const router = useRouter(), inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<ProductImportMode>("replace");
  const [preview, setPreview] = useState<ProductImportPreview | null>(null);
  const [busy, setBusy] = useState<"preview" | "apply" | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function resetPreview() { setPreview(null); setError(""); setSuccess(""); }

  async function upload(action: "preview" | "apply") {
    if (!file || busy || !writable || action === "apply" && !preview?.canApply) return;
    setBusy(action); setError(""); setSuccess("");
    const form = new FormData();
    form.set("file", file); form.set("mode", mode); form.set("action", action);
    if (action === "apply" && preview) { form.set("revision", String(preview.revision)); form.set("fingerprint", preview.fingerprint); }
    try {
      const response = await fetch("/api/genlix-admin/products/import", { method: "POST", body: form });
      const data = await response.json() as { error?: string; preview?: ProductImportPreview; success?: boolean; revision?: number; unchanged?: boolean };
      if (data.preview) setPreview(data.preview);
      if (!response.ok || data.error) {
        if (response.status === 409) setPreview(null);
        throw new Error(data.error ?? "Не удалось обработать файл.");
      }
      if (data.success) {
        setSuccess(data.unchanged ? "Каталог уже соответствует файлу. Изменения не потребовались." : `Импорт применён. Товары на сайте обновлены. Версия каталога: ${data.revision}.`);
        setPreview(null); setFile(null);
        if (inputRef.current) inputRef.current.value = "";
        router.refresh();
      }
    } catch (error) { setError(error instanceof Error ? error.message : "Не удалось обработать файл. Попробуйте ещё раз."); }
    finally { setBusy(null); }
  }

  return <>
    <section className={admin.panel}>
      <h2>1. Подготовьте файл</h2>
      <p>Один файл содержит отдельные листы для мяса, птицы, пива и воды, инструкцию и примеры из каталога. Заполняйте товары с третьей строки. Названия листов и колонок сохраняйте.</p>
      <div className={admin.inlineActions}>
        <a className={admin.primaryLink} href="/api/genlix-admin/products/excel?type=template">Скачать шаблон .xlsx</a>
        <a className={admin.primaryLink} href="/api/genlix-admin/products/excel?type=catalog">Выгрузить текущий каталог</a>
      </div>
      <p className={admin.helpText}>Выгрузка содержит опубликованные товары с их ID. Черновики и архив в неё не включаются. Для нового товара очистите ID и адрес страницы. В ячейках с фото и видео размещайте каждую ссылку с новой строки.</p>
    </section>
    {!writable ? <p className={admin.alert} role="alert">{warning ?? "Хранилище доступно только для чтения."}</p> : null}
    <section className={admin.panel}>
      <h2>2. Загрузите и проверьте</h2>
      <fieldset disabled={Boolean(busy) || !writable} className={styles.controls}>
        <label className={admin.field}>
          <span>Заполненный Excel-файл</span>
          <input ref={inputRef} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={event => {
            resetPreview();
            const selected = event.currentTarget.files?.[0] ?? null;
            if (selected && (!selected.name.toLowerCase().endsWith(".xlsx") || selected.size > PRODUCT_IMPORT_MAX_BYTES)) {
              setError("Выберите файл .xlsx размером до 3 МБ."); setFile(null); event.currentTarget.value = "";
            } else setFile(selected);
          }} />
        </label>
        <p className={admin.helpText}>До 3 МБ и 2000 товаров. Примеры не импортируются. Пустая необязательная ячейка очищает соответствующее поле товара.</p>
        <div className={styles.modes} role="radiogroup" aria-label="Режим импорта">
          <label className={styles.mode}>
            <input type="radio" name="importMode" value="replace" checked={mode === "replace"} onChange={() => { setMode("replace"); resetPreview(); }} />
            <span><strong>Замена отдельных товаров</strong><small>Товары с ID обновляются, без ID добавляются. Остальной каталог сохраняется.</small></span>
          </label>
          <label className={styles.mode}>
            <input type="radio" name="importMode" value="full" checked={mode === "full"} onChange={() => { setMode("full"); resetPreview(); }} />
            <span><strong>Полное обновление каталога</strong><small>Файл задаёт весь каталог во всех четырёх категориях. Товары, которых нет в файле, перемещаются в архив.</small></span>
          </label>
        </div>
        <button type="button" className={styles.primaryButton} disabled={!file} onClick={() => upload("preview")}>{busy === "preview" ? "Проверяем файл…" : "Проверить файл"}</button>
      </fieldset>
    </section>
    {error ? <p className={admin.alert} role="alert">{error}</p> : null}
    {success ? <div className={admin.successAlert} role="status"><p>{success}</p><Link href="/genlix-admin/products">К товарам</Link>{" · "}<Link href="/genlix-admin/backups">История и восстановление</Link></div> : null}
    {preview ? <section className={admin.panel} aria-live="polite">
      <h2>3. Результат проверки</h2>
      {preview.issueCount ? <>
        <p className={admin.alert} role="alert">Найдено ошибок: {preview.issueCount}. Исправьте файл и загрузите его снова. Каталог пока не изменён.</p>
        <div className={admin.tableWrap}><table className={admin.table}>
          <thead><tr><th>Лист</th><th>Ячейка</th><th>Поле</th><th>Ошибка</th></tr></thead>
          <tbody>{preview.issues.map((issue, index) => <tr key={index}><td>{issue.sheet}</td><td>{issue.row ? `${issue.column}${issue.row}` : "—"}</td><td>{issue.field}</td><td>{issue.message}</td></tr>)}</tbody>
        </table></div>
        {preview.issueCount > preview.issues.length ? <p className={admin.helpText}>Показаны первые {preview.issues.length} ошибок. После исправления проверьте файл ещё раз.</p> : null}
      </> : <>
        <div className={styles.counts}>
          {([ ["create", "Новые"], ["update", "Замена"], ["publish", "Публикация"], ["unchanged", "Без изменений"], ["archive", "В архив"] ] as const).map(([key, label]) => <div key={key}><strong>{preview.counts[key]}</strong><span>{label}</span></div>)}
        </div>
        {preview.draftCount ? <p className={admin.helpText}>У {preview.draftCount} изменяемых товаров есть черновики. При импорте их заменят данные из файла.</p> : null}
        {preview.mode === "full" ? <p className={styles.fullNotice}>Полное обновление затронет все четыре категории. В архив перейдут {preview.counts.archive} товаров, отсутствующих в файле.</p> : null}
        <div className={`${admin.tableWrap} ${styles.changeTable}`}><table className={admin.table}>
          <thead><tr><th>Действие</th><th>Товар</th><th>Категория</th><th>Строка файла</th></tr></thead>
          <tbody>{preview.changes.map((change, index) => <tr key={index}><td>{changeLabels[change.kind]}</td><td>{change.title}</td><td>{change.category}</td><td>{change.sheet ? `${change.sheet}, ${change.row}` : "—"}</td></tr>)}</tbody>
        </table></div>
        <p className={admin.helpText}>«Применить импорт» сразу обновляет товары на сайте. Все изменения сохранятся одной версией в истории каталога.</p>
        <button type="button" className={styles.primaryButton} disabled={Boolean(busy) || !preview.canApply} onClick={() => upload("apply")}>{busy === "apply" ? "Применяем импорт…" : "Применить импорт"}</button>
      </>}
    </section> : null}
  </>;
}
