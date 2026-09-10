"use client";

import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { HeroActions } from "./HeroActions";

import styles from "@/app/home.module.css";
import { getHeroStorySceneIndex, getRemainingMapIntroMs, getGrowingRouteDelayMs, heroMapScene, heroStoryScenes, HERO_STORY_VIDEO_SRC } from "@/lib/home-hero-story";

const SliderHero = lazy(() => import("./SliderHero"));
const journeyScenes = [heroMapScene, ...heroStoryScenes];

export type HomeHeroVariant = 1 | 2 | 3 | 5 | 6;

type HomeHeroProps = {
  variant?: HomeHeroVariant;
};

const belarusOutline =
  "M 1185.8 268.8 L 1183.5 263.2 L 1189.8 260.5 L 1181.5 252.4 L 1182.1 247.5 L 1170.1 244 L 1163.8 246.9 L 1163.1 249.1 L 1164.5 249.5 L 1160.2 251.9 L 1160.1 256.3 L 1150.4 257.6 L 1152.3 265.1 L 1149 267.7 L 1151 268.9 L 1150.9 272.3 L 1157.9 269.7 L 1180.5 274 L 1182.2 268.9 Z";

const supplyRoutes = [
  {
    id: "pacific-canada",
    origin: [515, 279],
    path: "M 515 279 Q 820 82 1168 259",
    wave: 0,
    phase: 0,
  },
  {
    id: "western-europe",
    origin: [1027, 330],
    path: "M 1027 330 Q 1090 254 1168 259",
    wave: 0,
    phase: 0.12,
  },
  {
    id: "russia-west",
    origin: [1284, 247],
    path: "M 1284 247 Q 1224 217 1168 259",
    wave: 0,
    phase: 0.24,
  },
  {
    id: "china",
    origin: [1510, 352],
    path: "M 1510 352 Q 1347 211 1168 259",
    wave: 0,
    phase: 0.36,
  },
  {
    id: "central-usa",
    origin: [638, 344],
    path: "M 638 344 Q 870 170 1168 259",
    wave: 1,
    phase: 0,
  },
  {
    id: "brazil",
    origin: [846, 555],
    path: "M 846 555 Q 877 334 1168 259",
    wave: 1,
    phase: 0.14,
  },
  {
    id: "west-africa",
    origin: [1025, 430],
    path: "M 1025 430 Q 1062 318 1168 259",
    wave: 4,
    phase: 0,
  },
  {
    id: "russia-siberia",
    origin: [1480, 220],
    path: "M 1480 220 Q 1305 137 1168 259",
    wave: 4,
    phase: 0.14,
  },
  {
    id: "mexico",
    origin: [683, 418],
    path: "M 683 418 Q 885 247 1168 259",
    wave: 2,
    phase: 0,
  },
  {
    id: "south-africa",
    origin: [1139, 662],
    path: "M 1139 662 Q 1060 444 1168 259",
    wave: 2,
    phase: 0.14,
  },
  {
    id: "middle-east",
    origin: [1270, 382],
    path: "M 1270 382 Q 1238 294 1168 259",
    wave: 1,
    phase: 0.28,
  },
  {
    id: "argentina",
    origin: [783, 686],
    path: "M 783 686 Q 872 373 1168 259",
    wave: 3,
    phase: 0,
  },
  {
    id: "east-africa",
    origin: [1193, 502],
    path: "M 1193 502 Q 1118 375 1168 259",
    wave: 3,
    phase: 0.14,
  },
  {
    id: "india",
    origin: [1391, 430],
    path: "M 1391 430 Q 1322 282 1168 259",
    wave: 3,
    phase: 0.28,
  },
  {
    id: "russia-far-east",
    origin: [1660, 288],
    path: "M 1660 288 Q 1415 125 1168 259",
    wave: 2,
    phase: 0.28,
  },
  {
    id: "southeast-asia",
    origin: [1488, 487],
    path: "M 1488 487 Q 1396 281 1168 259",
    wave: 4,
    phase: 0.28,
  },
  {
    id: "australia",
    origin: [1640, 658],
    path: "M 1640 658 Q 1508 270 1168 259",
    wave: 3,
    phase: 0.36,
  },
] as const;

const supplyWaveDuration = 6;
const supplyWaveCount = 5;
const supplyCycleDuration = supplyWaveDuration * supplyWaveCount;

function StaticHero() {
  return (
    <>
      <div className={styles.heroParallax} aria-hidden="true" />
      <div className={styles.heroGlow} aria-hidden="true" />
      <div className={styles.shell}>
        <div className={styles.heroCopy}>
          <p className={`${styles.eyebrow} ${styles.heroReveal}`} style={{ animationDelay: "120ms" }}>
            Эксклюзивный дистрибьютор для HoReCa &amp; Retail
          </p>
          <h1 className={styles.heroReveal} id="hero-title" style={{ animationDelay: "260ms" }}>
            Premium-мясо и напитки
            <br />
            для профессионалов
          </h1>
          <p className={`${styles.heroLead} ${styles.heroReveal}`} style={{ animationDelay: "420ms" }}>
            Прямые импортные поставки. Сертифицированное качество.
            <br />
            Работаем с HoReCa и Ритейлом.
          </p>
          <HeroActions />
        </div>
      </div>
    </>
  );
}

function VideoHero({ active }: { active: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (active && !paused) void video.play().catch(() => undefined);
    else video.pause();
  }, [active, paused]);

  return (
    <>
      <video
        className={styles.heroVideo}
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/assets/about/video_cover.png"
        aria-hidden="true"
      >
        <source src="/assets/home/hero-video.mp4" type="video/mp4" />
      </video>
      <div className={styles.heroVideoShade} aria-hidden="true" />
      <div className={styles.shell}>
        <div className={`${styles.heroCopy} ${styles.videoHeroCopy}`}>
          <p className={`${styles.eyebrow} ${styles.heroReveal}`} style={{ animationDelay: "120ms" }}>
            Genlix / вкус начинается с поставки
          </p>
          <h1 className={styles.heroReveal} id="hero-title" style={{ animationDelay: "260ms" }}>
            Премиальный продукт
            <br />
            в каждом кадре
          </h1>
          <p className={`${styles.heroLead} ${styles.heroReveal}`} style={{ animationDelay: "420ms" }}>
            От отбора и хранения до кухни ресторана —
            <br />
            один стандарт качества Genlix.
          </p>
          <HeroActions />
        </div>
      </div>
      <button
        type="button"
        className={styles.videoToggle}
        aria-label={paused ? "Продолжить видео" : "Приостановить видео"}
        aria-pressed={paused}
        onClick={() => setPaused((value) => !value)}
      >
        {paused ? <span className={styles.playIcon} /> : <><i /><i /></>}
        {paused ? "Продолжить" : "Пауза"}
      </button>
    </>
  );
}

type SupplyMapHeroProps = {
  visualOnly?: boolean;
  forcePaused?: boolean;
  illuminated?: boolean;
  growing?: boolean;
  onMapReady?: () => void;
};

function SupplyMapHero({ visualOnly = false, forcePaused = false, illuminated = false, growing = false, onMapReady }: SupplyMapHeroProps = {}) {
  const [paused, setPaused] = useState(false);
  const [pageHidden, setPageHidden] = useState(false);

  useEffect(() => {
    const updateVisibility = () => setPageHidden(document.hidden);
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  const animationPaused = paused || pageHidden || forcePaused;

  return (
    <>
      <div
        className={[styles.supplyMapLayer, growing ? styles.supplyMapGrowing : "", animationPaused ? styles.supplyMapPaused : ""]
          .filter(Boolean)
          .join(" ")}
        aria-hidden="true"
      >
        <div className={styles.supplyMapPlane}>
          <Image
            className={styles.supplyMapImage}
            src="/assets/home/hero-map-clean.png"
            alt=""
            fill
            sizes="(max-aspect-ratio: 1823/863) 212vh, 100vw"
            quality={90}
            preload
            onLoad={onMapReady}
            onError={onMapReady}
          />
          {illuminated ? <div className={styles.supplyMapCityLights} /> : null}
          <svg
            className={styles.supplyMapGraphic}
            viewBox="0 0 1823 863"
            focusable="false"
          >
            <defs>
              <filter id="supply-route-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="supply-minsk-glow" x="-200%" y="-200%" width="500%" height="500%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {illuminated ? (
              <g className={styles.supplyMapLights}>
                <defs>
                  <radialGradient id="supply-city-light">
                    <stop offset="0" stopColor="#fff5db" stopOpacity="0.95" />
                    <stop offset="0.12" stopColor="#ffc48f" stopOpacity="0.8" />
                    <stop offset="0.38" stopColor="#ff8a50" stopOpacity="0.28" />
                    <stop offset="1" stopColor="#ff7048" stopOpacity="0" />
                  </radialGradient>
                </defs>
                {supplyRoutes.map((route) => (
                  <g key={route.id} transform={`translate(${route.origin[0]} ${route.origin[1]})`}>
                    <circle className={styles.supplyCityGlow} r="22" />
                    <circle className={styles.supplyCityLight} r="1.8" />
                  </g>
                ))}
                <circle className={styles.supplyCityGlow} cx="1168" cy="259" r="52" />
              </g>
            ) : null}

            <g className={styles.supplyRoutes}>
              {supplyRoutes.map((route, index) => {
                const routeStyle = {
                  "--supply-delay": `${route.wave * supplyWaveDuration + route.phase}s`,
                  "--supply-cycle": `${supplyCycleDuration}s`,
                  "--route-reveal-delay": `${getGrowingRouteDelayMs(index)}ms`,
                  "--route-cargo-delay": `${getGrowingRouteDelayMs(index) + 1100}ms`,
                } as CSSProperties;

                return (
                  <g
                    className={styles.supplyRouteGroup}
                    data-wave={route.wave}
                    data-route-index={index}
                    key={route.id}
                    style={routeStyle}
                  >
                    <path
                      className={styles.supplyRouteShadow}
                      d={route.path}
                      pathLength="1"
                      vectorEffect="non-scaling-stroke"
                    />
                    <path
                      className={styles.supplyRoute}
                      d={route.path}
                      pathLength="1"
                      vectorEffect="non-scaling-stroke"
                    />
                    <circle
                      className={styles.supplyOriginPulse}
                      cx={route.origin[0]}
                      cy={route.origin[1]}
                      r="5"
                    />
                    <circle
                      className={styles.supplyOriginNode}
                      cx={route.origin[0]}
                      cy={route.origin[1]}
                      r="3.5"
                    />
                    <g
                      className={styles.supplyCargo}
                      style={{ offsetPath: `path("${route.path}")` }}
                    >
                      <circle className={styles.supplyCargoGlow} r="8" />
                      <circle className={styles.supplyCargoRing} r="5" />
                      <circle className={styles.supplyCargoDot} r="2.8" />
                    </g>
                  </g>
                );
              })}
            </g>

            <path
              className={styles.belarusOutline}
              d={belarusOutline}
              pathLength="1"
              vectorEffect="non-scaling-stroke"
            />

            <g className={styles.minskFocus}>
              <circle className={styles.minskPulse} cx="1168" cy="259" r="12" />
              <circle className={`${styles.minskPulse} ${styles.minskPulseSecond}`} cx="1168" cy="259" r="12" />
              <circle className={styles.minskGlow} cx="1168" cy="259" r="8" />
              <circle className={styles.minskPoint} cx="1168" cy="259" r="4" />
              <path className={styles.minskCallout} d="M 1176 255 L 1200 240 L 1318 240" vectorEffect="non-scaling-stroke" />
              <g className={styles.minskLabel}>
                <text className={styles.minskCountry} x="1204" y="225">БЕЛАРУСЬ</text>
                <text className={styles.minskCaption} x="1204" y="258">МИНСК · ЦЕНТР ПОСТАВОК</text>
              </g>
            </g>
          </svg>
        </div>
      </div>

      <div className={styles.supplyMapShade} aria-hidden="true" />
      {!visualOnly ? <>
      <div className={`${styles.shell} ${styles.supplyMapShell}`}>
        <div className={`${styles.heroCopy} ${styles.supplyMapCopy}`}>
          <p className={`${styles.eyebrow} ${styles.heroReveal}`} style={{ animationDelay: "120ms" }}>
            География поставок / Беларусь
          </p>
          <h1 className={styles.heroReveal} id="hero-title" style={{ animationDelay: "260ms" }}>
            Премиальные продукты —
            <br />
            напрямую в Беларусь
          </h1>
          <p className={`${styles.heroLead} ${styles.heroReveal}`} style={{ animationDelay: "420ms" }}>
            Мясо, птица, пиво и вода от проверенных производителей
            <br />
            для HoReCa и ритейла.
          </p>
          <HeroActions />
        </div>
      </div>

      <button
        type="button"
        className={`${styles.videoToggle} ${styles.supplyMapToggle}`}
        aria-label={paused ? "Продолжить движение поставок" : "Приостановить движение поставок"}
        aria-pressed={paused}
        onClick={() => setPaused((value) => !value)}
      >
        {paused ? <span className={styles.playIcon} /> : <><i /><i /></>}
        {paused ? "Продолжить" : "Пауза"}
      </button>
      </> : null}
    </>
  );
}

function JourneySequence({ onReplay }: { onReplay: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mapElapsedRef = useRef(0);
  const [paused, setPaused] = useState(true);
  const [pageHidden, setPageHidden] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  const [videoStarted, setVideoStarted] = useState(false);
  const [mapCycle, setMapCycle] = useState(0);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [playbackIssue, setPlaybackIssue] = useState<"blocked" | "error" | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const motionPaused = paused || pageHidden;
  const videoVisible = videoStarted && playbackIssue !== "error";
  const activeSceneIndex = videoVisible ? sceneIndex + 1 : 0;

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPaused(preference.matches);
    const updateVisibility = () => setPageHidden(document.hidden);
    updatePreference();
    updateVisibility();
    preference.addEventListener("change", updatePreference);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      preference.removeEventListener("change", updatePreference);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  useEffect(() => {
    if (!mapReady || motionPaused || introComplete) return;
    const startedAt = performance.now();
    const timer = window.setTimeout(() => setIntroComplete(true), getRemainingMapIntroMs(mapElapsedRef.current));
    return () => {
      window.clearTimeout(timer);
      mapElapsedRef.current += performance.now() - startedAt;
    };
  }, [mapReady, motionPaused, introComplete]);

  useEffect(() => {
    // Let the map paint first. Reduced-motion/hidden tabs don't fetch video.
    if (!mapReady || motionPaused || videoEnabled) return;
    const timer = window.setTimeout(() => setVideoEnabled(true), 1500);
    return () => window.clearTimeout(timer);
  }, [mapReady, motionPaused, videoEnabled]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !introComplete || motionPaused) return;
    // Keep the final frame during the fade back to the map; rewind only
    // when the next ten-second map intro has finished.
    if (video.ended) video.currentTime = 0;
    let cancelled = false;
    void video.play().catch(() => {
      if (!cancelled) setPlaybackIssue(video.error ? "error" : "blocked");
    });
    return () => {
      cancelled = true;
      video.pause();
    };
  }, [introComplete, motionPaused, videoEnabled]);

  const returnToMap = () => {
    mapElapsedRef.current = 0;
    setIntroComplete(false);
    setVideoStarted(false);
    setSceneIndex(0);
    setMapCycle((value) => value + 1);
  };

  const togglePlayback = () => {
    if (playbackIssue && introComplete) {
      const video = videoRef.current;
      if (!video) return;
      if (video.error) video.load();
      setPlaybackIssue(null);
      setPaused(false);
      // Retry directly from the gesture, including browsers that block autoplay.
      void video.play().catch(() => setPlaybackIssue(video.error ? "error" : "blocked"));
    } else setPaused((value) => !value);
  };
  const playLabel = playbackIssue && introComplete ? "Запустить видео" : paused ? "Продолжить" : "Пауза";

  return (
    <div className={styles.journeySequence} data-map-ready={mapReady} data-story-stage={videoVisible ? "video" : "map"} data-story-scene={journeyScenes[activeSceneIndex].id}>
      <div className={`${styles.journeyMap} ${videoVisible ? styles.journeyMapHidden : ""}`} aria-hidden="true">
        <SupplyMapHero key={mapCycle} visualOnly illuminated growing onMapReady={() => setMapReady(true)} forcePaused={!mapReady || motionPaused || videoVisible} />
      </div>
      <div className={`${styles.journeyVideo} ${videoVisible ? styles.journeyVideoVisible : ""}`} aria-hidden="true">
        {videoEnabled ? <video
          className={styles.heroVideo}
          ref={videoRef}
          muted
          playsInline
          preload="auto"
          onEnded={returnToMap}
          onPlaying={(event) => {
            setSceneIndex(getHeroStorySceneIndex(event.currentTarget.currentTime));
            setVideoStarted(true);
            setPlaybackIssue(null);
          }}
          onTimeUpdate={(event) => setSceneIndex(getHeroStorySceneIndex(event.currentTarget.currentTime))}
          onSeeked={(event) => setSceneIndex(getHeroStorySceneIndex(event.currentTarget.currentTime))}
          onError={() => setPlaybackIssue("error")}
        >
          <source src={HERO_STORY_VIDEO_SRC} type="video/mp4" onError={() => setPlaybackIssue("error")} />
        </video> : null}
        <div className={styles.heroVideoShade} />
      </div>

      <div className={`${styles.shell} ${styles.supplyMapShell}`}>
        <div className={`${styles.heroCopy} ${styles.supplyMapCopy} ${styles.journeyCopy}`}>
          <div className={styles.journeyCaptions}>
            {journeyScenes.map((scene, index) => (
              <div
                key={scene.id}
                className={`${styles.journeyCaption} ${index === activeSceneIndex ? styles.journeyCaptionActive : ""}`}
                aria-hidden={index !== activeSceneIndex}
              >
                <p className={styles.eyebrow}>{scene.eyebrow}</p>
                <h1 id={index === activeSceneIndex ? "hero-title" : undefined}>{scene.title}</h1>
                <p className={styles.heroLead}>{scene.text}</p>
              </div>
            ))}
          </div>
          <HeroActions />
        </div>
      </div>

      <div className={styles.journeyControls}>
        {playbackIssue && introComplete ? <p className={styles.journeyNotice} role="status">{playbackIssue === "error" ? "Видео не загрузилось. Попробуйте ещё раз." : "Нажмите, чтобы запустить видео."}</p> : null}
        <button type="button" className={styles.videoToggle} onClick={onReplay} aria-label="Начать с карты заново">Сначала</button>
        <button
          type="button"
          className={styles.videoToggle}
          onClick={togglePlayback}
          aria-label={playbackIssue && introComplete ? "Запустить видео" : paused ? "Продолжить показ" : "Приостановить показ"}
          aria-pressed={paused || Boolean(playbackIssue && introComplete)}
        >
          {paused || playbackIssue ? <span className={styles.playIcon} /> : <><i /><i /></>}
          {playLabel}
        </button>
      </div>
    </div>
  );
}

function JourneyHero() {
  const [replay, setReplay] = useState(0);
  return <JourneySequence key={replay} onReplay={() => setReplay((value) => value + 1)} />;
}

export function HomeHero({ variant = 1 }: HomeHeroProps) {
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero || variant !== 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const offset = Math.min(window.scrollY, hero.offsetHeight);
        hero.style.setProperty("--hero-parallax", `${offset * 0.28}px`);
        hero.style.setProperty("--hero-glow-shift", `${offset * 0.12}px`);
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [variant]);

  return (
    <section
      className={[
        styles.hero,
        variant === 2 ? styles.heroVariantSlider : "",
        variant === 3 ? styles.heroVariantVideo : "",
        variant === 5 ? styles.heroVariantSupplyMap : "",
        variant === 6 ? styles.heroVariantJourney : "",
      ]
        .filter(Boolean)
        .join(" ")}
      ref={heroRef}
      aria-labelledby="hero-title"
      data-hero-version={variant}
    >
      {variant === 1 ? <StaticHero /> : null}
      {variant === 2 ? <Suspense fallback={<StaticHero />}><SliderHero /></Suspense> : null}
      {variant === 3 ? <VideoHero active /> : null}
      {variant === 5 ? <SupplyMapHero /> : null}
      {variant === 6 ? <JourneyHero /> : null}
    </section>
  );
}
