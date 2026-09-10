"use client";

import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import styles from "@/app/home.module.css";

const Advantages = lazy(() => import("@/components/AdvantagesSlider").then((module) => ({ default: module.AdvantagesSlider })));
const Testimonials = lazy(() => import("@/components/TestimonialsSlider").then((module) => ({ default: module.TestimonialsSlider })));

function NearViewport({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  const container = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!container.current) return;
    if (!("IntersectionObserver" in window)) {
      const frame = requestAnimationFrame(() => setReady(true));
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setReady(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px", threshold: 0 },
    );
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);

  return <div ref={container}>{ready ? <Suspense fallback={fallback}>{children}</Suspense> : fallback}</div>;
}

export function DeferredAdvantages() {
  return (
    <NearViewport fallback={<div className={`${styles.advantagesSlider} ${styles.advantagesPlaceholder}`} aria-busy="true" aria-label="Преимущества загружаются" />}>
      <Advantages />
    </NearViewport>
  );
}

export function DeferredTestimonials() {
  return (
    <NearViewport fallback={<div className={styles.testimonialsPlaceholder} aria-busy="true" aria-label="Отзывы загружаются" />}>
      <Testimonials />
    </NearViewport>
  );
}
