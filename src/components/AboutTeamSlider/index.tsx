"use client";

import { useRef } from "react";
import { EffectFade, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";

import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/pagination";

import styles from "./AboutTeamSlider.module.css";

const TRANSITION_MS = 220;

export type TeamMember = {
  id: string;
  role: string;
  name: string;
  description: string;
  image: string;
};

export const teamMembers: TeamMember[] = [
  {
    id: "ceo",
    role: "Генеральный директор",
    name: "Имя Фамилия",
    description: "Стратегия компании и развитие партнёрской сети",
    image: "/assets/about/person2.png",
  },
  {
    id: "commercial",
    role: "Коммерческий директор",
    name: "Имя Фамилия",
    description: "Развитие продаж и работа с ключевыми клиентами HoReCa и ритейла",
    image: "/assets/about/person1.jpg",
  },
  {
    id: "logistics",
    role: "Директор по логистике",
    name: "Имя Фамилия",
    description: "Организация поставок и контроль холодовой цепи",
    image: "/assets/about/person3.jpg",
  },
  {
    id: "quality",
    role: "Руководитель отдела качества",
    name: "Имя Фамилия",
    description: "Контроль стандартов и сертификация продукции",
    image: "/assets/about/person4.jpg",
  },
  {
    id: "partners",
    role: "Менеджер по работе с партнёрами",
    name: "Имя Фамилия",
    description: "Сопровождение ресторанов и торговых сетей",
    image: "/assets/about/person5.jpg",
  },
];

function getMember(index: number, offset: number) {
  const total = teamMembers.length;
  return teamMembers[(index + offset + total) % total];
}

type TeamSlideProps = {
  index: number;
  onNavigate: (targetIndex: number) => void;
};

function TeamSlide({ index, onNavigate }: TeamSlideProps) {
  const active = teamMembers[index];
  const previous = getMember(index, -1);
  const sideMembers = [1, 2, 3].map((offset) => ({
    member: getMember(index, offset),
    targetIndex: (index + offset) % teamMembers.length,
  }));

  return (
    <div className={styles.slide}>
      <button
        aria-label={`Показать: ${previous.name}`}
        className={styles.prevButton}
        type="button"
        onClick={() => onNavigate((index - 1 + teamMembers.length) % teamMembers.length)}
      >
        <img alt="" className={styles.prevImage} height={290} src={previous.image} width={277} />
      </button>

      <div className={styles.mainWrap}>
        <img
          alt={active.name}
          className={styles.mainImage}
          height={543}
          src={active.image}
          width={574}
        />
      </div>

      <div className={styles.infoCol}>
        <div className={styles.info}>
          <h3 className={styles.name}>{active.name}</h3>
          <p className={styles.role}>{active.role}</p>
          <p className={styles.description}>{active.description}</p>
        </div>

        <div className={styles.thumbs}>
          {sideMembers.map(({ member, targetIndex }) => (
            <button
              aria-label={`Показать: ${member.name}`}
              className={styles.thumbButton}
              key={`${member.id}-${targetIndex}`}
              type="button"
              onClick={() => onNavigate(targetIndex)}
            >
              <img alt="" className={styles.thumbImage} height={290} src={member.image} width={277} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AboutTeamSlider() {
  const swiperRef = useRef<SwiperType | null>(null);

  const navigateTo = (targetIndex: number) => {
    swiperRef.current?.slideTo(targetIndex, TRANSITION_MS);
  };

  return (
    <div className={styles.slider}>
      <Swiper
        className={styles.swiper}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        modules={[EffectFade, Pagination]}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        pagination={{ clickable: true }}
        slidesPerView={1}
        speed={TRANSITION_MS}
      >
        {teamMembers.map((member, index) => (
          <SwiperSlide className={styles.swiperSlide} key={member.id}>
            <TeamSlide index={index} onNavigate={navigateTo} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
