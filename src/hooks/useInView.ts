"use client";

import { useEffect, useState, type RefObject } from "react";

type UseInViewOptions = {
  once?: boolean;
  threshold?: number;
  rootMargin?: string;
};

export function useInView<T extends Element>(
  ref: RefObject<T | null>,
  { once = true, threshold = 0.15, rootMargin = "0px 0px -8% 0px" }: UseInViewOptions = {},
) {
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setIsInView(false);
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [once, threshold, rootMargin, ref]);

  return isInView;
}
