"use client";

import { useId, useState } from "react";
import { ProductVideos } from "@/components/ProductVideos";
import { MAX_PRODUCT_VIDEOS, PRODUCT_VIDEO_FILE_SIZE_MB, normalizeProductVideoUrl } from "@/lib/catalog/product-videos";
import styles from "@/app/genlix-admin/admin.module.css";

export function AdminProductVideosEditor({ videos = [], poster }: { videos?: string[]; poster?: string }) {
  const fieldId = useId();
  const [source, setSource] = useState(videos.join("\n"));
  const [touched, setTouched] = useState(false);
  const lines = source.split(/\r?\n/).map((line, index) => ({ source: line.trim(), number: index + 1 })).filter((line) => line.source);
  const normalized = lines.map((line) => normalizeProductVideoUrl(line.source));
  const validVideos = Array.from(new Set(normalized.filter((video): video is string => video !== null))).slice(0, MAX_PRODUCT_VIDEOS);
  const invalidLines = normalized.flatMap((video, index) => video ? [] : [lines[index].number]);
  const error = lines.length > MAX_PRODUCT_VIDEOS
    ? `Можно добавить не более ${MAX_PRODUCT_VIDEOS} роликов.`
    : invalidLines.length ? `Проверьте ссылки в строках: ${invalidLines.join(", ")}. Нужна YouTube-ссылка или прямая HTTPS-ссылка на MP4/WebM.` : "";

  return (
    <section className={styles.formSection}>
      <h2>Видео товара</h2>
      <p className={styles.helpText} id={`${fieldId}-help`}>Добавьте YouTube-ссылки или прямые HTTPS-ссылки на MP4/WebM, по одной на строку. Порядок строк задаёт порядок роликов. Превью появятся под кнопкой заявки после публикации товара.</p>
      <p className={styles.helpText} id={`${fieldId}-size`}>Размер одного файла по прямой ссылке — до {PRODUCT_VIDEO_FILE_SIZE_MB} МБ. Если видео больше, загрузите его на YouTube и вставьте YouTube-ссылку.</p>
      <label className={styles.field} htmlFor={fieldId}>
        <span id={`${fieldId}-label`}>Ссылки на видео</span>
        <textarea
          id={fieldId}
          name="videos"
          value={source}
          onChange={(event) => setSource(event.target.value)}
          onBlur={() => setTouched(true)}
          aria-invalid={touched && Boolean(error) || undefined}
          aria-labelledby={`${fieldId}-label`}
          aria-describedby={`${fieldId}-help ${fieldId}-size${touched && error ? ` ${fieldId}-error` : ""}`}
          maxLength={MAX_PRODUCT_VIDEOS * 2_001}
          placeholder={"https://www.youtube.com/watch?v=…\nhttps://example.com/video.mp4"}
        />
      </label>
      {touched && error ? <p className={styles.alert} id={`${fieldId}-error`} role="alert">{error}</p> : null}
      {validVideos.length ? <ProductVideos videos={validVideos} title="Предпросмотр товара" poster={poster} /> : null}
    </section>
  );
}
