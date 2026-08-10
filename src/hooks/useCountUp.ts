"use client";

import { useEffect, useState } from "react";

export function useCountUp(end: number, isActive: boolean, duration = 1600) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(end);
      return;
    }

    let startTime: number | null = null;
    let frame = 0;

    const step = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(eased * end));
      if (progress < 1) frame = window.requestAnimationFrame(step);
    };

    frame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame);
  }, [duration, end, isActive]);

  return value;
}
