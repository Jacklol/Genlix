"use client";

import dynamic from "next/dynamic";
import { Component, createContext, startTransition, useActionState, useContext, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { saveNews } from "@/app/genlix-admin/(panel)/news/actions";
import type { TextContentBlock } from "@/lib/text-content";
import { RICH_TEXT_VERSION, toEditorBlocks, type RichBlock } from "@/lib/rich-text";
import { RichArticleContent } from "@/components/RichArticleContent";
import adminStyles from "@/app/genlix-admin/admin.module.css";
import articleStyles from "@/components/TextArticleLayout/TextArticleLayout.module.css";
import styles from "./AdminNewsEditor.module.css";

const BlockEditor = dynamic(() => import("./BlockEditor"), { ssr: false, loading: () => <p className={styles.loading} role="status">Загружаем редактор…</p> });
const Context = createContext<{
  pending: boolean; uploading: number; ready: boolean;
  title: string; tag: string; markDirty: () => void;
  update: (blocks: RichBlock[], changed: boolean) => void;
  setUploading: (change: number) => void;
} | null>(null);
export function useNewsEditor() { const value = useContext(Context); if (!value) throw new Error("Missing news editor context"); return value; }

class EditorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <p role="alert" className={adminStyles.alert}>Не удалось загрузить редактор. Сохранённая статья не изменена. Обновите страницу и попробуйте снова.</p> : this.props.children; }
}

export function NewsEditorForm({ children, initialTitle, initialTag }: { children: ReactNode; initialTitle: string; initialTag: string }) {
  const [state, dispatch, pending] = useActionState(saveNews, null);
  const [uploading, updateUploading] = useState(0);
  const [ready, setReady] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [tag, setTag] = useState(initialTag);
  const document = useRef<RichBlock[]>([]);
  const dirty = useRef(false);
  const alert = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (state?.error) alert.current?.focus(); }, [state]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty.current) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || uploading || !ready) return;
    const data = new FormData(event.currentTarget, (event.nativeEvent as SubmitEvent).submitter);
    data.set("richContent", JSON.stringify({ type: "richText", version: RICH_TEXT_VERSION, blocks: document.current }));
    // Manual dispatch preserves uncontrolled inputs and the document on validation/network errors.
    startTransition(() => dispatch(data));
  }
  return <Context.Provider value={{ pending, uploading, ready, title, tag, markDirty: () => { dirty.current = true; }, setUploading: (change) => updateUploading((n) => Math.max(0, n + change)), update: (blocks, changed) => { document.current = blocks; setReady(true); if (changed) dirty.current = true; } }}>
    <form onSubmit={submit} onInput={(event) => {
      dirty.current = true;
      const input = event.target as HTMLInputElement;
      if (input.name === "title") setTitle(input.value);
      if (input.name === "tag") setTag(input.value);
    }}>
      {state?.error ? <p ref={alert} className={adminStyles.alert} role="alert" tabIndex={-1}>{state.error} Набранный текст сохранён в форме.</p> : null}
      <fieldset className={`${adminStyles.formGrid} ${styles.fields}`} disabled={pending}>{children}</fieldset>
    </form>
  </Context.Provider>;
}

export function NewsSubmitButton({ intent, children, className }: { intent: "draft" | "publish"; children: ReactNode; className?: string }) {
  const { pending, uploading, ready } = useNewsEditor();
  return <button disabled={pending || uploading > 0 || !ready} name="intent" value={intent} type="submit" className={className}>{pending ? "Сохраняем…" : uploading ? "Загружаем фото…" : children}</button>;
}

export function NewsArticleEditor({ content }: { content: TextContentBlock[] }) {
  const context = useNewsEditor();
  const [initial] = useState(() => toEditorBlocks(content));
  const [blocks, setBlocks] = useState(initial);
  const [preview, setPreview] = useState(false);
  return <div className={styles.root}>
    <div className={styles.topBar}>
      <span>Текст статьи</span>
      <button type="button" aria-pressed={preview} disabled={!context.ready} onClick={() => setPreview((value) => !value)}>{preview ? "Вернуться к редактированию" : "Предпросмотр текста"}</button>
    </div>
    <div hidden={preview}>
      <EditorBoundary><BlockEditor initialContent={initial} disabled={context.pending} onUploadChange={context.setUploading} onDocument={(value, changed) => { setBlocks(value); context.update(value, changed); }} /></EditorBoundary>
    </div>
    {preview ? <div className={`${articleStyles.content} ${styles.preview}`}><RichArticleContent blocks={blocks} /></div> : null}
    <p className={styles.help}>Выделите текст для форматирования. Нажмите «+» слева или введите «/», чтобы добавить заголовок, список, фото или таблицу. Блоки можно перетаскивать.</p>
    <p className={styles.help}>Фото: JPG, PNG или WebP до 3 МБ. Чтобы сохранить изменения, нажмите «Сохранить черновик» или «Опубликовать».</p>
    {context.uploading > 0 ? <p className={styles.help} role="status">Загружаем фотографии: {context.uploading}… Не закрывайте страницу.</p> : null}
  </div>;
}
