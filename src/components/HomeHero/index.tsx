"use client";

import { useEffect, useRef } from "react";

import styles from "@/app/home.module.css";

export function HomeHero() {
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

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
  }, []);

  return (
    <section className={styles.hero} ref={heroRef} aria-labelledby="hero-title">
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
          <div className={`${styles.heroActions} ${styles.heroReveal}`} style={{ animationDelay: "560ms" }}>
            <a className={styles.primaryButton} href="#contacts">
              Стать партнёром
            </a>
            <a className={styles.secondaryButton} href="#catalog">
              Перейти в каталог
            </a>
          </div>
        </div>
      </div>
      <div className={styles.scrollCue} aria-hidden="true">
        <span />
      </div>
    </section>
  );
}
