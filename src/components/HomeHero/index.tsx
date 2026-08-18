"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Swiper as SwiperType } from "swiper";
import { Autoplay, EffectFade } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import styles from "@/app/home.module.css";

import "swiper/css";
import "swiper/css/effect-fade";

export type HomeHeroVariant = 1 | 2 | 3 | 5;

type HomeHeroProps = {
  variant?: HomeHeroVariant;
};

const slides = [
  {
    eyebrow: "01 / Производители",
    title: <>Отбираем лучшее<br />у проверенных поставщиков</>,
    text: "Прямые контракты и строгий контроль качества каждой партии.",
    image: "/assets/about/control1.png",
    position: "center",
  },
  {
    eyebrow: "02 / Логистика",
    title: <>Доставляем точно<br />и без разрывов</>,
    text: "Собственная логистика и отгрузка для HoReCa и ритейла 24/7.",
    image: "/assets/about/control2.png",
    position: "center",
  },
  {
    eyebrow: "03 / Хранение",
    title: <>Сохраняем качество<br />на каждом градусе</>,
    text: "Контролируем температурный режим, хранение и созревание премиального мяса.",
    image: "/assets/about/control3.png",
    position: "center",
  },
  {
    eyebrow: "04 / Ресторан",
    title: <>Продукт, которому<br />доверяют шефы</>,
    text: "Поставляем сырьё, которое раскрывается в блюде и возвращает гостя в ресторан.",
    image: "/assets/news/news_hero.png",
    position: "center",
  },
  {
    eyebrow: "05 / Ассортимент",
    title: <>Всё для сильной<br />премиальной карты</>,
    text: "Мясо, птица, пиво, вода и гастрономические дополнения — у одного поставщика.",
    image: "/assets/home/product-strip.png",
    position: "center",
  },
] as const;

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

function HeroActions() {
  return (
    <div className={`${styles.heroActions} ${styles.heroReveal}`} style={{ animationDelay: "560ms" }}>
      <a className={styles.primaryButton} href="#contacts">
        Стать партнёром
      </a>
      <a className={styles.secondaryButton} href="#catalog">
        Перейти в каталог
      </a>
    </div>
  );
}

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

function SliderArrow({ next = false }: { next?: boolean }) {
  return (
    <svg viewBox="0 0 28 12" aria-hidden="true">
      <path d={next ? "M0 6h26m-5-5 5 5-5 5" : "M28 6H2m5-5-5 5 5 5"} />
    </svg>
  );
}

function SliderHero() {
  const [swiper, setSwiper] = useState<SwiperType | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(media.matches);
    updatePreference();
    media.addEventListener("change", updatePreference);
    return () => media.removeEventListener("change", updatePreference);
  }, []);

  return (
    <div className={styles.sliderHero}>
      <Swiper
        className={styles.heroSlider}
        modules={[Autoplay, EffectFade]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        speed={900}
        loop
        autoplay={reducedMotion ? false : { delay: 5200, disableOnInteraction: false }}
        onSwiper={setSwiper}
        onRealIndexChange={(instance) => setActiveIndex(instance.realIndex)}
      >
        {slides.map((slide, index) => (
          <SwiperSlide className={styles.heroSlide} key={slide.eyebrow}>
            <div
              className={styles.heroSlideImage}
              style={{ backgroundImage: `url("${slide.image}")`, backgroundPosition: slide.position }}
              aria-hidden="true"
            />
            <div className={styles.shell}>
              <div className={styles.sliderCopy}>
                <p className={styles.eyebrow}>{slide.eyebrow}</p>
                <h1 id={index === 0 ? "hero-title" : undefined}>{slide.title}</h1>
                <p className={styles.heroLead}>{slide.text}</p>
                <HeroActions />
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <div className={`${styles.shell} ${styles.heroSliderUi}`}>
        <div className={styles.heroProgress} aria-label={`Слайд ${activeIndex + 1} из ${slides.length}`}>
          {slides.map((slide, index) => (
            <button
              type="button"
              className={index === activeIndex ? styles.heroProgressActive : undefined}
              aria-label={`Перейти к слайду ${index + 1}`}
              aria-current={index === activeIndex ? "true" : undefined}
              key={slide.eyebrow}
              onClick={() => swiper?.slideToLoop(index)}
            >
              <span />
            </button>
          ))}
        </div>
        <div className={styles.heroSliderArrows}>
          <button type="button" aria-label="Предыдущий слайд" onClick={() => swiper?.slidePrev()}>
            <SliderArrow />
          </button>
          <button type="button" aria-label="Следующий слайд" onClick={() => swiper?.slideNext()}>
            <SliderArrow next />
          </button>
        </div>
      </div>
    </div>
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

function SupplyMapHero() {
  const [paused, setPaused] = useState(false);
  const [pageHidden, setPageHidden] = useState(false);

  useEffect(() => {
    const updateVisibility = () => setPageHidden(document.hidden);
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  const animationPaused = paused || pageHidden;

  return (
    <>
      <div
        className={[styles.supplyMapLayer, animationPaused ? styles.supplyMapPaused : ""]
          .filter(Boolean)
          .join(" ")}
        aria-hidden="true"
      >
        <div className={styles.supplyMapPlane}>
          <div className={styles.supplyMapImage} />
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

            <g className={styles.supplyRoutes}>
              {supplyRoutes.map((route) => {
                const routeStyle = {
                  "--supply-delay": `${route.wave * supplyWaveDuration + route.phase}s`,
                  "--supply-cycle": `${supplyCycleDuration}s`,
                } as CSSProperties;

                return (
                  <g
                    className={styles.supplyRouteGroup}
                    data-wave={route.wave}
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
    </>
  );
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
      ]
        .filter(Boolean)
        .join(" ")}
      ref={heroRef}
      aria-labelledby="hero-title"
      data-hero-version={variant}
    >
      {variant === 1 ? <StaticHero /> : null}
      {variant === 2 ? <SliderHero /> : null}
      {variant === 3 ? <VideoHero active /> : null}
      {variant === 5 ? <SupplyMapHero /> : null}
    </section>
  );
}
