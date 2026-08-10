"use client";

import { useState } from "react";
import type { Swiper as SwiperType } from "swiper";
import { EffectFade } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import styles from "@/app/home.module.css";
import { testimonials } from "@/lib/site-data";

import "swiper/css";
import "swiper/css/effect-fade";

export function TestimonialsSlider() {
  const [swiper, setSwiper] = useState<SwiperType | null>(null);

  return (
    <blockquote>
      <Swiper
        className={styles.testimonialsTrack}
        modules={[EffectFade]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        slidesPerView={1}
        speed={600}
        autoHeight
        loop={testimonials.length > 1}
        onSwiper={setSwiper}
      >
        {testimonials.map((item) => (
          <SwiperSlide key={item.name}>
            <div className={styles.quoteRule} />
            <h3>
              {item.title} <span>{item.titleAccent}</span>
            </h3>
            <p>{item.quote}</p>
            <footer>
              <span className={styles.avatar}>{item.initials}</span>
              <span>
                <strong>{item.name}</strong>
                <small>{item.role}</small>
              </span>
            </footer>
          </SwiperSlide>
        ))}
      </Swiper>
      <div className={styles.quoteControls}>
        <button
          type="button"
          className={styles.quoteControl}
          aria-label="Предыдущий отзыв"
          onClick={() => swiper?.slidePrev()}
        >
          <i aria-hidden="true" />
        </button>
        <button
          type="button"
          className={styles.quoteControl}
          aria-label="Следующий отзыв"
          onClick={() => swiper?.slideNext()}
        >
          <i aria-hidden="true" />
        </button>
      </div>
    </blockquote>
  );
}
