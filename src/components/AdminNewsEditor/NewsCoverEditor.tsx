"use client";

import { useEffect, useRef, useState } from "react";
import { uploadNewsImage } from "@/app/genlix-admin/(panel)/news/actions";
import { MAX_PRODUCT_IMAGE_BYTES, PRODUCT_IMAGE_TYPES } from "@/lib/cms/product-editor";
import { useNewsEditor } from "./index";
import adminStyles from "@/app/genlix-admin/admin.module.css";
// Shared upload, thumbnail and action styles keep product and article forms identical.
import styles from "@/components/AdminProductEditor/AdminProductEditor.module.css";
import newsStyles from "@/app/news/news.module.css";
import coverStyles from "./NewsCoverEditor.module.css";

type Cover = { url: string; name: string };
type Candidate = Cover & { file: File; error?: string };

export function NewsCoverEditor({ initialImage }: { initialImage: string }) {
  const { pending, title, tag, setUploading, markDirty } = useNewsEditor();
  const [cover, setCover] = useState<Cover | null>(initialImage ? { url: initialImage, name: "Текущая обложка" } : null);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [uploading, setBusy] = useState(false);
  const [fileDrag, setFileDrag] = useState(false);
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = useRef(false);
  const mounted = useRef(true);
  const previews = useRef(new Set<string>());

  useEffect(() => {
    mounted.current = true;
    const urls = previews.current;
    return () => { mounted.current = false; urls.forEach((url) => URL.revokeObjectURL(url)); urls.clear(); };
  }, []);

  function release(url?: string) { if (url && previews.current.delete(url)) URL.revokeObjectURL(url); }

  async function upload(item: Candidate) {
    if (busy.current || pending) return;
    busy.current = true;
    setBusy(true); setUploading(1); markDirty();
    setCandidate({ ...item, error: undefined });
    setMessage("");
    try {
      const data = new FormData(); data.set("file", item.file);
      const result = await uploadNewsImage(data);
      if ("error" in result) throw new Error(result.error);
      if (!mounted.current) return;
      setCover({ url: result.url, name: item.name });
      setCandidate(null); release(item.url);
      setMessage("Обложка загружена. Сохраните статью, чтобы применить изменение.");
    } catch (error) {
      if (mounted.current) setCandidate({ ...item, error: error instanceof Error ? error.message : "Не удалось загрузить фото. Повторите попытку." });
    } finally {
      busy.current = false;
      setUploading(-1);
      if (mounted.current) setBusy(false);
    }
  }

  function choose(files: File[]) {
    if (pending || busy.current || !files.length) return;
    if (files.length !== 1) { setMessage("Для статьи нужна одна обложка. Выберите один файл."); return; }
    const file = files[0];
    if (!PRODUCT_IMAGE_TYPES.includes(file.type) || !file.size || file.size > MAX_PRODUCT_IMAGE_BYTES) {
      setMessage(`${file.name}: нужен JPEG, PNG или WebP, не больше 3 МБ.`); return;
    }
    release(candidate?.url);
    const url = URL.createObjectURL(file); previews.current.add(url);
    void upload({ url, name: file.name, file });
  }

  const shown = candidate ?? cover;
  const disabled = pending || uploading;
  return <section className={adminStyles.formSection} id="news-cover" aria-labelledby="news-cover-title">
    <h2 id="news-cover-title">Обложка статьи</h2>
    <p className={adminStyles.helpText}>Одна главная фотография для карточки в блоге и страницы статьи.</p>
    <input type="hidden" name="image" value={candidate ? "" : cover?.url ?? ""} />
    <div className={styles.imageWorkspace}>
      <div className={styles.galleryEditor}>
        <div className={`${styles.dropzone} ${fileDrag ? styles.dropzoneActive : ""}`}
          onDragOver={(event) => {
            if (!event.dataTransfer.types.includes("Files")) return;
            event.preventDefault(); event.dataTransfer.dropEffect = disabled ? "none" : "copy";
            if (!disabled) setFileDrag(true);
          }}
          onDragLeave={() => setFileDrag(false)}
          onDrop={(event) => { event.preventDefault(); setFileDrag(false); if (!disabled) choose(Array.from(event.dataTransfer.files)); }}>
          <strong>Перетащите фото сюда</strong>
          <span>JPEG, PNG, WebP · до 3 МБ</span>
          <input ref={inputRef} className={styles.fileInput} type="file" accept={PRODUCT_IMAGE_TYPES.join(",")}
            aria-label="Загрузить обложку статьи" disabled={disabled}
            onChange={(event) => { const files = Array.from(event.currentTarget.files ?? []); event.currentTarget.value = ""; choose(files); }} />
          <button type="button" className={styles.addButton} disabled={disabled} onClick={() => inputRef.current?.click()}>{cover ? "Заменить фото" : "Выбрать фото"}</button>
        </div>
        <p className={styles.message} role="status" aria-live="polite">{message}</p>
        {shown ? <ul className={`${styles.thumbnails} ${coverStyles.singleThumbnail}`} aria-label="Обложка статьи">
          <li className={`${styles.thumbnail} ${styles.mainThumbnail} ${coverStyles.thumbnail}`}>
            <div className={styles.thumbnailMedia}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={shown.url} alt="Миниатюра обложки" draggable={false} />
              <span className={styles.imageNumber}>Обложка</span>
            </div>
            <span className={styles.fileName} title={shown.name}>{shown.name}</span>
            {uploading ? <span className={styles.uploadStatus} role="status">Загружается…</span> : null}
            {candidate?.error ? <div className={styles.uploadError} role="alert">
              <span>{candidate.error}</span>
              <button type="button" disabled={disabled} onClick={() => void upload(candidate)}>Повторить</button>
            </div> : null}
            <div className={styles.photoActions}>
              <button type="button" className={styles.removeButton} disabled={disabled} onClick={() => {
                if (candidate) {
                  release(candidate.url); setCandidate(null);
                  setMessage(cover ? "Замена отменена. Прежняя обложка осталась." : "Неудачная загрузка убрана. Выберите другую фотографию.");
                } else {
                  setCover(null); markDirty();
                  setMessage("Обложка убрана из формы. Загрузите новую перед сохранением. Исходный файл и история сохранены.");
                }
              }}>{candidate ? "Отменить загрузку" : "Убрать"}</button>
            </div>
          </li>
        </ul> : null}
      </div>
      <div className={styles.preview}>
        <p className={styles.previewLabel}>Предпросмотр обложки</p>
        <article className={newsStyles.card}>
          <div className={newsStyles.cardMedia}>
            {shown ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shown.url} alt="Обложка в карточке блога" className={styles.previewImage} />
            ) : <span className={styles.emptyPreview}>Добавьте обложку статьи</span>}
          </div>
          <div className={newsStyles.cardBody}>
            {tag ? <div className={newsStyles.cardMeta}><span className={newsStyles.cardTag}>{tag}</span></div> : null}
            <h3 className={newsStyles.cardTitle}>{title || "Заголовок статьи"}</h3>
          </div>
        </article>
        <p className={adminStyles.helpText}>Предпросмотр карточки в блоге. На странице статьи фото отображается крупнее. Изменения появятся на сайте после публикации.</p>
      </div>
    </div>
    <p className={adminStyles.helpText}>Файл загружается сразу с уникальным именем. Замена обложки не удаляет прежний файл и историю статьи.</p>
  </section>;
}
