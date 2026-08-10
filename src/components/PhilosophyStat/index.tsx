"use client";

import { useRef } from "react";

import styles from "@/app/home.module.css";
import { useCountUp } from "@/hooks/useCountUp";
import { useInView } from "@/hooks/useInView";

export function PhilosophyStat() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref);
  const years = useCountUp(12, isInView);

  return (
    <div
      ref={ref}
      className={`${styles.statCard} ${styles.revealFromRight} ${isInView ? styles.isVisible : ""}`}
    >
      <span>01</span>
      <strong>{years} лет</strong>
      <p>на рынке</p>
    </div>
  );
}
