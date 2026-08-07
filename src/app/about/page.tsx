import type { Metadata } from "next";

import { AboutPhilosophySection } from "@/components/AboutPhilosophySection";
import { AboutTeamSlider } from "@/components/AboutTeamSlider";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { CommercialProposalSection } from "@/components/CommercialProposalSection";
import homeStyles from "@/app/home.module.css";

import styles from "./about.module.css";

const controlItems = [
  {
    tag: "Производство",
    title: "Производственные цеха",
    image: "/assets/about/control1.png",
  },
  {
    tag: "Логистика",
    title: "Склады",
    image: "/assets/about/control2.png",
  },
  {
    tag: "Хранение",
    title: "Камеры созревания",
    image: "/assets/about/control3.png",
  },
] as const;

const certificateItems = [
  {
    title: "Ветеринарный сертификат",
    description: "Сопроводительные документы на продукцию",
    image: "/assets/about/cert.png",
    href: "#",
  },
  {
    title: "Сертификат Халяль",
    description: "Подтверждение соответствия требованиям Халяль",
    image: "/assets/about/cert.png",
    href: "#",
  },
  {
    title: "Органический сертификат",
    description: "Подтверждение стандартов органической продукции",
    image: "/assets/about/cert.png",
    href: "#",
  },
] as const;

export const metadata: Metadata = {
  title: "О компании — Genlix",
  description:
    "Поставляем premium-продукцию для HoReCa и ритейла, контролируя качество, хранение и логистику на каждом этапе сотрудничества.",
};

export default function AboutPage() {
  return (
    <main className={homeStyles.page}>
      <Header activeLink="О компании" static />

      <Breadcrumbs
        items={[
          { label: "Главная", href: "/" },
          { label: "О компании" },
        ]}
      />

      <section className={styles.hero} aria-labelledby="about-hero-title">
        <div className={styles.heroInner}>
          <h1 className={styles.title} id="about-hero-title">
            Качество, на котором строятся партнёрства
          </h1>
          <p className={styles.lead}>
            Поставляем premium-продукцию для HoReCa и ритейла, контролируя качество, хранение и
            логистику на каждом этапе сотрудничества.
          </p>
          <div className={styles.actions}>
            <a className={styles.primaryButton} href="#about-content">
              Узнать о компании
            </a>
            <a className={styles.secondaryButton} href="#certificates">
              Смотреть сертификаты
            </a>
          </div>
        </div>
      </section>

      <AboutPhilosophySection />

      <section className={styles.geography} aria-labelledby="about-geography-title">
        <div className={homeStyles.shell}>
          <div className={styles.geographyLayout}>
            <div className={styles.geographyCopy}>
              <p className={styles.geographyKicker}>География импорта</p>
              <h2 className={styles.geographyTitle} id="about-geography-title">
                Не просто продукты, <span>а надёжное партнёрство</span>
              </h2>
              <p className={styles.geographyText}>
                Мы строим сотрудничество на стабильном качестве, прозрачных условиях и внимании к
                задачам каждого партнёра — от ресторана до торговой сети.
              </p>
            </div>

            <div className={styles.geographyMapWrap}>
              <img
                alt="Карта Беларуси с регионами поставок Genlix"
                className={styles.geographyMap}
                height={520}
                src="/assets/about/map.png"
                width={720}
              />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.control} aria-labelledby="about-control-title">
        <div className={homeStyles.shell}>
          <div className={styles.controlHeader}>
            <div className={styles.controlIntro}>
              <p className={styles.controlKicker}>Производство и хранение</p>
              <h2 className={styles.controlTitle} id="about-control-title">
                Контроль условий <span>на каждом этапе</span>
              </h2>
              <p className={styles.controlText}>
                Мы строим сотрудничество на стабильном качестве, прозрачных условиях и внимании к
                задачам каждого партнёра — от ресторана до торговой сети.
              </p>
            </div>
            <span className={styles.controlMarker} aria-hidden="true">
              03
            </span>
          </div>

          <div className={styles.controlGrid}>
            {controlItems.map((item) => (
              <article className={styles.controlCard} key={item.title}>
                <img alt="" className={styles.controlCardImage} height={286} src={item.image} width={560} />
                <div className={styles.controlCardBody}>
                  <p className={styles.controlCardTag}>{item.tag}</p>
                  <h3 className={styles.controlCardTitle}>{item.title}</h3>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.certificates} id="certificates" aria-labelledby="about-certificates-title">
        <div className={homeStyles.shell}>
          <div className={styles.certificatesHeader}>
            <div className={styles.certificatesIntro}>
              <p className={styles.certificatesKicker}>Сертификаты</p>
              <h2 className={styles.certificatesTitle} id="about-certificates-title">
                <span>Документы,</span> подтверждающие качество
              </h2>
              <p className={styles.certificatesText}>
                Мы строим сотрудничество на стабильном качестве, прозрачных условиях и внимании к
                задачам каждого партнёра — от ресторана до торговой сети.
              </p>
            </div>
            <span className={styles.certificatesMarker} aria-hidden="true">
              04
            </span>
          </div>

          <div className={styles.certificatesGrid}>
            {certificateItems.map((item) => (
              <article className={styles.certificateCard} key={item.title}>
                <div className={styles.certificateImageWrap}>
                  <img
                    alt=""
                    className={styles.certificateImage}
                    height={280}
                    src={item.image}
                    width={400}
                  />
                </div>
                <div className={styles.certificateBody}>
                  <h3 className={styles.certificateTitle}>{item.title}</h3>
                  <p className={styles.certificateDescription}>{item.description}</p>
                  <a className={styles.certificateLink} href={item.href}>
                    Скачать
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.team} aria-labelledby="about-team-title">
        <div className={homeStyles.shell}>
          <div className={styles.teamHeader}>
            <div className={styles.teamIntro}>
              <p className={styles.teamKicker}>Команда</p>
              <h2 className={styles.teamTitle} id="about-team-title">
                <span>Люди,</span> которые отвечают за результат
              </h2>
              <p className={styles.teamText}>
                Мы строим сотрудничество на стабильном качестве, прозрачных условиях и внимании к
                задачам каждого партнёра — от ресторана до торговой сети.
              </p>
            </div>
            <span className={styles.teamMarker} aria-hidden="true">
              05
            </span>
          </div>

          <AboutTeamSlider />
        </div>
      </section>

      <CommercialProposalSection />
      <Footer />
    </main>
  );
}
