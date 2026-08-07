"use client";

import { useState } from "react";
import { Thumbs } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";

import styles from "./ProductDetailGallery.module.css";

import "swiper/css";

function ChevronUpIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="16"
      viewBox="0 0 16 16"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        clipRule="evenodd"
        d="M7.95833 6.71107L4.46068 10.2312C4.24496 10.4483 3.89374 10.4483 3.67803 10.2312C3.46425 10.016 3.46425 9.66864 3.67803 9.45349L7.56949 5.53706C7.67263 5.43329 7.8125 5.375 7.95833 5.375C8.10417 5.375 8.24404 5.43329 8.34718 5.53706L12.2386 9.45349C12.4524 9.66864 12.4524 10.016 12.2386 10.2312C12.0229 10.4483 11.6717 10.4483 11.456 10.2312L7.95833 6.71107Z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="16"
      viewBox="0 0 16 16"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        clipRule="evenodd"
        d="M7.95768 9.28893L11.4553 5.76884C11.6711 5.55174 12.0223 5.55174 12.238 5.76884C12.4518 5.98399 12.4518 6.33136 12.238 6.54651L8.34652 10.4629C8.24339 10.5667 8.10352 10.625 7.95768 10.625C7.81184 10.625 7.67198 10.5667 7.56884 10.4629L3.67737 6.54651C3.4636 6.33136 3.46359 5.98399 3.67737 5.76884C3.89309 5.55174 4.24431 5.55174 4.46003 5.76884L7.95768 9.28893Z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  );
}

type ProductDetailGalleryProps = {
  images: string[];
  title: string;
};

export function ProductDetailGallery({ images, title }: ProductDetailGalleryProps) {
  const [mainSwiper, setMainSwiper] = useState<SwiperType | null>(null);
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleSlideChange = (swiper: SwiperType) => {
    setActiveIndex(swiper.activeIndex);
    thumbsSwiper?.slideTo(Math.max(swiper.activeIndex - 1, 0));
  };

  return (
    <div className={styles.gallery}>
      <div className={styles.thumbsColumn}>
        <button
          type="button"
          className={styles.navButton}
          aria-label="Предыдущее фото"
          disabled={activeIndex === 0}
          onClick={() => mainSwiper?.slidePrev()}
        >
          <ChevronUpIcon />
        </button>

        <Swiper
          className={styles.thumbsSwiper}
          direction="vertical"
          modules={[Thumbs]}
          onSwiper={setThumbsSwiper}
          slidesPerView={4}
          spaceBetween={12}
          watchSlidesProgress
        >
          {images.map((image, index) => (
            <SwiperSlide className={styles.thumbSlide} key={`${image}-${index}`}>
              <button
                type="button"
                className={`${styles.thumbButton} ${activeIndex === index ? styles.thumbButtonActive : ""}`}
                style={{ backgroundImage: `url("${image}")` }}
                aria-label={`Показать фото ${index + 1}`}
                aria-current={activeIndex === index}
                onClick={() => mainSwiper?.slideTo(index)}
              />
            </SwiperSlide>
          ))}
        </Swiper>

        <button
          type="button"
          className={styles.navButton}
          aria-label="Следующее фото"
          disabled={activeIndex >= images.length - 1}
          onClick={() => mainSwiper?.slideNext()}
        >
          <ChevronDownIcon />
        </button>
      </div>

      <Swiper
        className={styles.mainSwiper}
        modules={[Thumbs]}
        onSwiper={setMainSwiper}
        onSlideChange={handleSlideChange}
        slidesPerView={1}
        spaceBetween={0}
        thumbs={{
          swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null,
        }}
      >
        {images.map((image, index) => (
          <SwiperSlide className={styles.mainSlide} key={`${image}-main-${index}`}>
            <img alt={`${title} — фото ${index + 1}`} className={styles.mainImage} src={image} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
