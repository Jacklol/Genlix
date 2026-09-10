"use client";

import { useEffect, useState } from "react";
import type { Swiper as SwiperType } from "swiper";
import { Autoplay, EffectFade } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import styles from "@/app/home.module.css";
import { HeroActions } from "./HeroActions";
import "swiper/css";
import "swiper/css/effect-fade";

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

function SliderArrow({ next = false }: { next?: boolean }) {
  return (
    <svg viewBox="0 0 28 12" aria-hidden="true">
      <path d={next ? "M0 6h26m-5-5 5 5-5 5" : "M28 6H2m5-5-5 5 5 5"} />
    </svg>
  );
}

export default function SliderHero() {
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
