"use client";

import Image from "next/image";
import { useState } from "react";

import { ProductPhotoPlaceholder } from "@/components/ProductPhotoPlaceholder";

import styles from "./AdminImage.module.css";

type AdminImageProps = {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  compact?: boolean;
};

function Photo({ src, alt = "", width = 58, height = 46, compact = true }: AdminImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <ProductPhotoPlaceholder compact={compact} label={failed ? "Фото недоступно" : undefined} />;
  }

  const isPreview = src.startsWith("blob:");

  return (
    <Image
      alt={alt}
      className={styles.image}
      draggable={false}
      height={height}
      loading={isPreview ? "eager" : "lazy"}
      onError={() => setFailed(true)}
      src={src}
      unoptimized={isPreview}
      width={width}
    />
  );
}

export function AdminImage({ className, ...props }: AdminImageProps) {
  return (
    <span className={`${styles.frame} ${className ?? styles.fill}`}>
      <Photo key={props.src} {...props} />
    </span>
  );
}
