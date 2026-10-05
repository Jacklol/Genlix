"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getProductVideo, type ProductVideo } from "@/lib/catalog/product-videos";

import styles from "./ProductVideos.module.css";

type ProductVideosProps = {
  videos: string[];
  title: string;
  poster?: string;
};

export function ProductVideos({ videos, title, poster }: ProductVideosProps) {
  const items = Array.from(new Map(videos.map(getProductVideo).filter((video): video is ProductVideo => video !== null).map((video) => [video.url, video])).values());
  const trackRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const filePlayerRef = useRef<HTMLVideoElement>(null);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [failedVideoUrl, setFailedVideoUrl] = useState<string | null>(null);
  const [navigation, setNavigation] = useState({ previous: false, next: items.length > 3 });

  const updateNavigation = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setNavigation({
      previous: track.scrollLeft > 1,
      next: track.scrollLeft + track.clientWidth < track.scrollWidth - 1,
    });
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new ResizeObserver(updateNavigation);
    observer.observe(track);
    return () => observer.disconnect();
  }, [items.length, updateNavigation]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!activeVideoUrl || !dialog) return;

    const player = filePlayerRef.current;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      if (player) {
        player.pause();
        player.removeAttribute("src");
        player.load();
      }
      document.body.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
    };
  }, [activeVideoUrl]);

  function scrollVideos(direction: number) {
    const track = trackRef.current;
    if (!track) return;
    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
    track.scrollBy({
      left: direction * (track.clientWidth + gap),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }

  if (!items.length) return null;

  const activeVideo = items.find((video) => video.url === activeVideoUrl);
  const activeNumber = items.findIndex((video) => video.url === activeVideoUrl) + 1;

  return (
    <section className={styles.section} aria-label={`Видео о товаре «${title}»`}>
      <div className={styles.track} ref={trackRef} onScroll={updateNavigation}>
        {items.map((video, index) => (
          <button
            type="button"
            className={styles.preview}
            aria-label={`Смотреть видео ${index + 1} о товаре «${title}»`}
            aria-haspopup="dialog"
            key={video.url}
            onClick={() => {
              setFailedVideoUrl(null);
              setActiveVideoUrl(video.url);
            }}
          >
            {video.type === "youtube" || poster ? (
              // Dynamic YouTube thumbnails and the product photo avoid preloading video files.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className={styles.thumbnail}
                src={video.type === "youtube" ? `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg` : poster}
                alt=""
                loading="lazy"
                decoding="async"
                onError={(event) => { event.currentTarget.hidden = true; }}
              />
            ) : null}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.playIcon} src="/assets/catalog/video/play.svg" width="40" height="40" alt="" />
            {video.type === "file" ? <span className={styles.fileFormat} aria-hidden="true">{video.format.toUpperCase()}</span> : null}
          </button>
        ))}
      </div>

      {items.length > 3 ? (
        <div className={styles.navigation}>
          <button type="button" aria-label="Предыдущие видео" disabled={!navigation.previous} onClick={() => scrollVideos(-1)}>←</button>
          <span>{items.length} видео</span>
          <button type="button" aria-label="Следующие видео" disabled={!navigation.next} onClick={() => scrollVideos(1)}>→</button>
        </div>
      ) : null}

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-label={`Видео ${activeNumber} о товаре «${title}»`}
        onClose={() => setActiveVideoUrl(null)}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
            event.currentTarget.close();
          }
        }}
      >
        <div className={styles.dialogHeader}>
          <p>Видео {activeNumber} · {title}</p>
          <button className={styles.closeButton} type="button" aria-label="Закрыть видео" onClick={() => dialogRef.current?.close()}>×</button>
        </div>
        {activeVideo?.type === "youtube" ? (
          <>
            <iframe
              className={styles.player}
              src={`https://www.youtube-nocookie.com/embed/${activeVideo.id}?autoplay=1&playsinline=1&rel=0`}
              title={`Видео ${activeNumber} о товаре «${title}»`}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
            <a className={styles.externalLink} href={activeVideo.url} target="_blank" rel="noopener noreferrer">Смотреть на YouTube</a>
          </>
        ) : activeVideo?.type === "file" ? (
          <>
            <video
              className={styles.player}
              ref={filePlayerRef}
              src={activeVideo.url}
              poster={poster}
              controls
              autoPlay
              playsInline
              preload="metadata"
              aria-label={`Видео ${activeNumber} о товаре «${title}»`}
              onError={() => setFailedVideoUrl(activeVideo.url)}
            />
            {failedVideoUrl === activeVideo.url ? <p className={styles.playerError} role="status">Не удалось загрузить видео. Попробуйте открыть его по ссылке.</p> : null}
            <a className={styles.externalLink} href={activeVideo.url} target="_blank" rel="noopener noreferrer">Открыть видео</a>
          </>
        ) : null}
      </dialog>
    </section>
  );
}
