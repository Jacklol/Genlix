"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";

import { useInView } from "@/hooks/useInView";

import styles from "./Reveal.module.css";

type RevealVariant = "fade-up" | "fade-left" | "fade-right" | "fade";

const variantClass: Record<RevealVariant, string> = {
  "fade-up": styles.fadeUp,
  "fade-left": styles.fadeLeft,
  "fade-right": styles.fadeRight,
  fade: styles.fade,
};

type RevealProps = {
  children: ReactNode;
  className?: string;
  variant?: RevealVariant;
  delay?: number;
  contents?: boolean;
};

export function Reveal({
  children,
  className,
  variant = "fade-up",
  delay = 0,
  contents = false,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref);

  return (
    <div
      ref={ref}
      className={[
        styles.reveal,
        variantClass[variant],
        isInView ? styles.visible : "",
        contents ? styles.contents : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
      data-revealed={isInView || undefined}
    >
      {children}
    </div>
  );
}
