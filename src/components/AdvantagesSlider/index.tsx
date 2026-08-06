"use client";

import { type ReactNode } from "react";
import { Swiper, SwiperSlide } from "swiper/react";

import { AdvantageDocumentsIcon } from "@/components/icons/AdvantageDocumentsIcon";
import { AdvantageIndividualTermsIcon } from "@/components/icons/AdvantageIndividualTermsIcon";
import { AdvantageLogisticsIcon } from "@/components/icons/AdvantageLogisticsIcon";
import { AdvantageManagerIcon } from "@/components/icons/AdvantageManagerIcon";
import { AdvantageQualityIcon } from "@/components/icons/AdvantageQualityIcon";
import styles from "@/app/home.module.css";

import "swiper/css";

const advantages: {
  index: string;
  icon: ReactNode;
  title: string;
  text: string;
}[] = [
  {
    index: "01",
    icon: <AdvantageLogisticsIcon />,
    title: "Собственная логистика",
    text: "Рефрижераторы и точные температурные режимы на всём маршруте.",
  },
  {
    index: "02",
    icon: <AdvantageIndividualTermsIcon />,
    title: "Индивидуальные условия",
    text: "Гибкие лимиты, графики поставок и цены под объём вашего бизнеса.",
  },
  {
    index: "03",
    icon: <AdvantageDocumentsIcon />,
    title: "Полный пакет документов",
    text: "Сертификация, ветеринарные и таможенные документы к каждой партии.",
  },
  {
    index: "04",
    icon: <AdvantageManagerIcon />,
    title: "Личный менеджер",
    text: "Один контакт для заказов, остатков, срочных задач и консультаций.",
  },
  {
    index: "05",
    icon: <AdvantageQualityIcon />,
    title: "Стабильное качество",
    text: "Одинаковая калибровка и органолептика от поставки к поставке.",
  },
];

export function AdvantagesSlider() {
  return (
    <div className={styles.advantagesSlider}>
      <Swiper
        className={styles.advantagesTrack}
        slidesPerView="auto"
        watchOverflow
      >
        {advantages.map((item) => (
          <SwiperSlide className={styles.advantage} key={item.title}>
            <span className={styles.advantageIndex}>{item.index}</span>
            <span className={styles.advantageIcon} aria-hidden="true">
              {item.icon}
            </span>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
