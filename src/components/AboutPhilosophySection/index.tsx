"use client";

import { useRef, useState } from "react";

import homeStyles from "@/app/home.module.css";

import styles from "./AboutPhilosophySection.module.css";

const VIDEO_SRC = "https://russteel.su/assets/images/video/video_2026-02-05_09-26-31.mp4";
const VIDEO_POSTER = "/assets/about/video_cover.png";

const philosophyItems = [
  {
    number: "01",
    title: "Качество без компромиссов",
    description: "Контроль продукции, документов, хранения и транспортировки на каждом этапе",
  },
  {
    number: "02",
    title: "Партнёрство на перспективу",
    description: "Индивидуальные условия, персональный менеджер и поддержка развития ассортимента",
  },
  {
    number: "03",
    title: "Ответственность за результат",
    description: "Стабильные поставки и прозрачная коммуникация для HoReCa и ритейла",
  },
] as const;

const introText =
  "Мы строим сотрудничество на стабильном качестве, прозрачных условиях и внимании к задачам каждого партнёра — от ресторана до торговой сети.";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);

  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function updateTimeLabel(video: HTMLVideoElement, setTimeLabel: (value: string) => void) {
  if (!Number.isFinite(video.duration) || video.duration <= 0) {
    return;
  }

  const remaining = Math.max(0, video.duration - video.currentTime);
  setTimeLabel(formatTime(remaining));
}

export function AboutPhilosophySection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [timeLabel, setTimeLabel] = useState<string | null>(null);

  const togglePlayback = async () => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    if (video.paused) {
      await video.play();
      setIsPlaying(true);
      return;
    }

    video.pause();
    setIsPlaying(false);
  };

  return (
    <section className={styles.section} id="about-content" aria-labelledby="about-philosophy-title">
      <div className={homeStyles.shell}>
        <div className={styles.layout}>
          <div className={styles.copy}>
            <p className={styles.kicker}>Наша философия</p>
            <h2 className={styles.title} id="about-philosophy-title">
              Не просто продукты, <span>а надёжное партнёрство</span>
            </h2>
            <p className={styles.lead}>{introText}</p>

            <ul className={styles.list}>
              {philosophyItems.map((item) => (
                <li className={styles.listItem} key={item.number}>
                  <div className={styles.listHead}>
                    <span className={styles.listNumber}>{item.number}</span>
                    <h3 className={styles.listTitle}>{item.title}</h3>
                  </div>
                  <p className={styles.listDescription}>{item.description}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.media}>
            <span className={styles.mediaMarker} aria-hidden="true">
              01
            </span>

            <div className={styles.videoWrap}>
              <video
                ref={videoRef}
                className={styles.video}
                playsInline
                poster={VIDEO_POSTER}
                preload="metadata"
                src={VIDEO_SRC}
                onDurationChange={(event) => {
                  updateTimeLabel(event.currentTarget, setTimeLabel);
                }}
                onEnded={() => {
                  const video = videoRef.current;
                  setIsPlaying(false);

                  if (video) {
                    video.currentTime = 0;
                    updateTimeLabel(video, setTimeLabel);
                  }
                }}
                onLoadedMetadata={(event) => {
                  updateTimeLabel(event.currentTarget, setTimeLabel);
                }}
                onPause={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
                onTimeUpdate={(event) => {
                  const video = event.currentTarget;
                  if (!video.duration) {
                    return;
                  }

                  setProgress((video.currentTime / video.duration) * 100);
                  updateTimeLabel(video, setTimeLabel);
                }}
              />

              {!isPlaying ? <div aria-hidden="true" className={styles.videoCoverOverlay} /> : null}

              <div className={styles.videoPanel}>
                <p className={styles.videoPanelTitle}>Единый стандарт качества</p>
                <p className={styles.videoPanelText}>{introText}</p>
              </div>

              <button
                aria-label={isPlaying ? "Пауза" : "Воспроизвести видео"}
                className={styles.playButton}
                type="button"
                onClick={() => {
                  void togglePlayback();
                }}
              >
                <span className={isPlaying ? styles.pauseIcon : styles.playIcon} aria-hidden="true" />
              </button>

              <div className={styles.videoFooter}>
                <span className={styles.videoLabel}>
                  О компании{timeLabel ? ` ${timeLabel}` : ""}
                </span>
                <div className={styles.progressTrack}>
                  <span className={styles.progressFill} style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
