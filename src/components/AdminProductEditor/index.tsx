"use client";

import {
  createContext, startTransition, useActionState, useContext, useEffect, useRef, useState,
  type FormEvent, type ReactNode, type Dispatch, type SetStateAction,
} from "react";

import { saveProduct, uploadProductImage } from "@/app/genlix-admin/(panel)/products/actions";
import { createProductSlug } from "@/lib/catalog/product-slug";
import {
  initialProductImages, moveProductImage, MAX_PRODUCT_IMAGES, MAX_PRODUCT_IMAGE_BYTES,
  PRODUCT_IMAGE_TYPES,
} from "@/lib/cms/product-editor";
import adminStyles from "@/app/genlix-admin/admin.module.css";
import cardStyles from "@/components/ProductCard/ProductCard.module.css";
import styles from "./AdminProductEditor.module.css";

type EditorImage = {
  id: string;
  url: string;
  name: string;
  status: "ready" | "uploading" | "error";
  file?: File;
  error?: string;
};

type EditorContextValue = {
  title: string;
  brand: string;
  images: EditorImage[];
  setImages: Dispatch<SetStateAction<EditorImage[]>>;
  pending: boolean;
  creationId: string;
  slug?: string;
};

const EditorContext = createContext<EditorContextValue | null>(null);

function useEditor() {
  const editor = useContext(EditorContext);
  if (!editor) throw new Error("Product editor context is missing");
  return editor;
}

type ProductEditorFormProps = {
  children: ReactNode;
  initialTitle: string;
  initialBrand: string;
  mainImage: string;
  gallery: string[];
  creationId: string;
  slug?: string;
};

export function ProductEditorForm({ children, initialTitle, initialBrand, mainImage, gallery, creationId, slug }: ProductEditorFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [brand, setBrand] = useState(initialBrand);
  const [images, setImages] = useState<EditorImage[]>(() => initialProductImages(mainImage, gallery).map((url, index) => ({
    id: `saved-${index}`, url, name: `Фото ${index + 1}`, status: "ready",
  })));
  const [state, dispatch, pending] = useActionState(saveProduct, null);
  const [formError, setFormError] = useState("");
  const alertRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (state?.error || formError) alertRef.current?.focus();
  }, [state, formError]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    if (images.some((item) => item.status !== "ready")) {
      setFormError("Дождитесь загрузки фото. Если есть ошибка — повторите загрузку или уберите фото из галереи.");
      return;
    }
    if (!images.length) {
      setFormError("Добавьте хотя бы одно фото товара.");
      return;
    }
    setFormError("");
    const data = new FormData(event.currentTarget, (event.nativeEvent as SubmitEvent).submitter);
    // Dispatch manually: returning a validation error must not reset uncontrolled
    // fields, photo order or uploaded URLs in React's automatic form reset.
    startTransition(() => dispatch(data));
  }

  return (
    <EditorContext.Provider value={{ title, brand, images, setImages, pending, creationId, slug }}>
      <form onSubmit={submit} onInput={(event) => {
        const target = event.target as HTMLInputElement;
        if (target.name === "title") setTitle(target.value);
        if (target.name === "brand") setBrand(target.value);
      }}>
        {state?.error || formError ? (
          <p className={adminStyles.alert} ref={alertRef} role="alert" tabIndex={-1}>{formError || state?.error}</p>
        ) : null}
        <fieldset className={`${adminStyles.formGrid} ${styles.formFields}`} disabled={pending}>
          {children}
        </fieldset>
      </form>
    </EditorContext.Provider>
  );
}

export function ProductSlugField() {
  const { title, creationId, slug } = useEditor();
  const generated = slug ?? (title.trim() ? createProductSlug(title, creationId) : "");
  return (
    <label className={adminStyles.field}>
      <span>Адрес страницы — автоматически</span>
      <input name="slug" readOnly value={generated} placeholder="Появится после ввода названия" aria-describedby="product-slug-help" />
      <input name="creationId" type="hidden" value={creationId} />
      <small className={adminStyles.helpText} id="product-slug-help">
        {slug ? "Адрес сохраняется при переименовании товара, чтобы прежние ссылки работали."
          : "Название латиницей + уникальный ID. Вручную заполнять не нужно."}
      </small>
    </label>
  );
}

export function ProductSubmitButton({ intent, children, className }: {
  intent: "draft" | "publish"; children: ReactNode; className?: string;
}) {
  const { images, pending } = useEditor();
  const uploading = images.some((item) => item.status === "uploading");
  return (
    <button className={className} disabled={pending || uploading} name="intent" type="submit" value={intent}>
      {pending ? "Сохраняем…" : uploading ? "Загружаем фото…" : children}
    </button>
  );
}

export function ProductImagesEditor() {
  const { title, brand, images, setImages, pending } = useEditor();
  const [message, setMessage] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [fileDrag, setFileDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const blobUrls = useRef(new Set<string>());
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const urls = blobUrls.current;
    return () => {
      mounted.current = false;
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  function releasePreview(url: string) {
    if (blobUrls.current.delete(url)) URL.revokeObjectURL(url);
  }

  async function upload(item: EditorImage) {
    if (!item.file) return;
    setImages((current) => current.map((image) => image.id === item.id ? { ...image, status: "uploading", error: undefined } : image));
    const data = new FormData();
    data.set("file", item.file);
    try {
      const result = await uploadProductImage(data);
      if (!mounted.current) return;
      if (result.error || !result.url) throw new Error(result.error || "Не удалось загрузить фото");
      setImages((current) => current.map((image) => image.id === item.id
        ? { ...image, url: result.url, status: "ready", file: undefined, error: undefined }
        : image));
      releasePreview(item.url);
    } catch (error) {
      if (!mounted.current) return;
      setImages((current) => current.map((image) => image.id === item.id ? {
        ...image, status: "error", error: error instanceof Error ? error.message : "Не удалось загрузить фото. Повторите попытку.",
      } : image));
    }
  }

  async function addFiles(files: File[]) {
    if (pending) return;
    const available = MAX_PRODUCT_IMAGES - images.length;
    const errors: string[] = [];
    const accepted: EditorImage[] = [];
    for (const file of files) {
      if (!PRODUCT_IMAGE_TYPES.includes(file.type) || !file.size || file.size > MAX_PRODUCT_IMAGE_BYTES) {
        errors.push(`${file.name}: нужен JPEG, PNG или WebP, не больше 3 МБ.`);
        continue;
      }
      if (accepted.length >= available) {
        errors.push(`В галерее может быть не больше ${MAX_PRODUCT_IMAGES} фото.`);
        break;
      }
      const url = URL.createObjectURL(file);
      blobUrls.current.add(url);
      accepted.push({ id: crypto.randomUUID(), url, name: file.name, status: "uploading", file });
    }
    setMessage(errors.join(" "));
    setImages((current) => [...current, ...accepted]);
    // Each upload stays below the platform's per-request body limit.
    for (const item of accepted) {
      if (!mounted.current) break;
      await upload(item);
    }
  }

  function move(id: string, to: number) {
    setImages((current) => moveProductImage(current, current.findIndex((item) => item.id === id), to));
    setMessage(to === 0 ? "Главное фото изменено. Сохраните товар, чтобы применить изменение." : "Порядок фото изменён. Сохраните товар, чтобы применить изменение.");
  }

  const main = images[0];
  return (
    <section className={adminStyles.formSection} id="product-images" aria-labelledby="product-images-title">
      <h2 id="product-images-title">Фото товара</h2>
      <p className={adminStyles.helpText}>Первое фото — главное, остальные — галерея. Перетаскивайте миниатюры или используйте кнопки под ними.</p>
      <input type="hidden" name="image" value={main?.status === "ready" ? main.url : ""} />
      <input type="hidden" name="images" value={images.slice(1).filter((item) => item.status === "ready").map((item) => item.url).join("\n")} />

      <div className={styles.imageWorkspace}>
        <div className={styles.galleryEditor}>
          <div
            className={`${styles.dropzone} ${fileDrag ? styles.dropzoneActive : ""}`}
            onDragOver={(event) => {
              if (pending || !event.dataTransfer.types.includes("Files")) return;
              event.preventDefault(); event.dataTransfer.dropEffect = "copy"; setFileDrag(true);
            }}
            onDragLeave={() => setFileDrag(false)}
            onDrop={(event) => {
              event.preventDefault(); setFileDrag(false);
              if (!pending) void addFiles(Array.from(event.dataTransfer.files));
            }}
          >
            <strong>Перетащите фото сюда</strong>
            <span>JPEG, PNG, WebP · до 3 МБ каждое</span>
            <input
              ref={inputRef} className={styles.fileInput} type="file" multiple
              accept={PRODUCT_IMAGE_TYPES.join(",")} aria-label="Загрузить фото товара"
              onChange={(event) => {
                const files = Array.from(event.currentTarget.files ?? []);
                event.currentTarget.value = "";
                void addFiles(files);
              }}
            />
            <button className={styles.addButton} type="button" onClick={() => inputRef.current?.click()}>Выбрать фото</button>
          </div>

          <p className={styles.message} role="status" aria-live="polite">{message}</p>
          <ol className={styles.thumbnails} aria-label="Порядок фотографий">
            {images.map((item, index) => (
              <li
                key={item.id}
                className={`${styles.thumbnail} ${index === 0 ? styles.mainThumbnail : ""} ${overId === item.id ? styles.dragTarget : ""}`}
                draggable={!pending}
                onDragStart={(event) => {
                  setDragId(item.id); event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", item.id);
                }}
                onDragEnd={() => { setDragId(null); setOverId(null); }}
                onDragOver={(event) => {
                  if (!pending && dragId && dragId !== item.id) {
                    event.preventDefault(); event.dataTransfer.dropEffect = "move"; setOverId(item.id);
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  if (!pending && dragId) move(dragId, index);
                  setDragId(null); setOverId(null);
                }}
              >
                <div className={styles.thumbnailMedia}>
                  {/* Blob previews must bypass the Next image optimizer. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt={`Фото ${index + 1}${index === 0 ? " — главное" : ""}`} draggable={false} />
                  <span className={styles.imageNumber}>{index === 0 ? "Главное" : `Фото ${index + 1}`}</span>
                  <span className={styles.dragHandle} aria-hidden="true">⠿</span>
                </div>
                <span className={styles.fileName} title={item.name}>{item.name}</span>
                {item.status === "uploading" ? <span className={styles.uploadStatus} role="status">Загружается…</span> : null}
                {item.status === "error" ? (
                  <div className={styles.uploadError} role="alert">
                    <span>{item.error}</span>
                    <button type="button" onClick={() => void upload(item)}>Повторить</button>
                  </div>
                ) : null}
                <div className={styles.photoActions}>
                  <button type="button" disabled={index === 0} aria-label={`Переместить фото ${index + 1} раньше`} onClick={() => move(item.id, index - 1)}>←</button>
                  <button type="button" disabled={index === images.length - 1} aria-label={`Переместить фото ${index + 1} позже`} onClick={() => move(item.id, index + 1)}>→</button>
                  <button className={styles.removeButton} type="button" aria-label={`Убрать фото ${index + 1} из галереи`} onClick={() => {
                    setImages((current) => current.filter((image) => image.id !== item.id));
                    releasePreview(item.url);
                    setMessage("Фото убрано из галереи. Сам файл и предыдущие версии товара сохранены.");
                  }}>Убрать</button>
                </div>
                {index > 0 ? <button className={styles.makeMain} type="button" onClick={() => move(item.id, 0)}>Сделать главным</button> : null}
              </li>
            ))}
          </ol>
        </div>

        <div className={styles.preview}>
          <p className={styles.previewLabel}>Предпросмотр главного фото</p>
          <div className={cardStyles.card}>
            <div className={cardStyles.media}>
              {main ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={main.url} alt="Главное фото в карточке каталога" className={styles.previewImage} />
              ) : <span className={styles.emptyPreview}>Добавьте фото товара</span>}
              {brand ? <span className={cardStyles.brand}>{brand}</span> : null}
            </div>
            <div className={cardStyles.body}><h3 className={cardStyles.title}>{title || "Название товара"}</h3></div>
          </div>
          <p className={adminStyles.helpText}>Так главное фото будет кадрироваться в каталоге. Изменения появятся на сайте после публикации товара.</p>
        </div>
      </div>
      <p className={adminStyles.helpText}>Файлы загружаются сразу и сохраняются с уникальными именами. Удаление миниатюры убирает фото только из этой галереи после сохранения — исходный файл и история остаются.</p>
    </section>
  );
}
