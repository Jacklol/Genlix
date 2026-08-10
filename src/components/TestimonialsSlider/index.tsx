"use client";

import { useState } from "react";
import type { Swiper as SwiperType } from "swiper";
import { EffectFade } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import styles from "@/app/home.module.css";
import { testimonials } from "@/lib/site-data";

import "swiper/css";
import "swiper/css/effect-fade";

const quoteArrowPath =
  "M0.292892 6.65686C-0.0976257 7.04739 -0.0976257 7.68055 0.292892 8.07107L6.65685 14.435C7.04738 14.8256 7.68054 14.8256 8.07107 14.435C8.46159 14.0445 8.46159 13.4113 8.07107 13.0208L2.41422 7.36397L8.07107 1.70711C8.46159 1.31659 8.46159 0.683424 8.07107 0.2929C7.68054 -0.0976243 7.04738 -0.0976243 6.65685 0.2929L0.292892 6.65686ZM129 7.36397V6.36397L1 6.36397V7.36397V8.36397L129 8.36397V7.36397Z";

function QuoteArrow({ flipped = false }: { flipped?: boolean }) {
  return (
    <svg
      width="129"
      height="15"
      viewBox="0 0 129 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={flipped ? styles.quoteArrowFlipped : undefined}
    >
      <path d={quoteArrowPath} fill="currentColor" />
    </svg>
  );
}

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
          <QuoteArrow />
        </button>
        <button
          type="button"
          className={`${styles.quoteControl} ${styles.quoteControlNext}`}
          aria-label="Следующий отзыв"
          onClick={() => swiper?.slideNext()}
        >
          <QuoteArrow flipped />
        </button>
      </div>
    </blockquote>
  );
}
