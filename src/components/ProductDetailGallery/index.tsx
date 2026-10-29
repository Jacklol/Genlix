"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import { ProductPhotoPlaceholder } from "@/components/ProductPhotoPlaceholder";

import styles from "./ProductDetailGallery.module.css";

type ProductDetailGalleryProps = {
  images: string[];
  title: string;
};

export function ProductDetailGallery({ images, title }: ProductDetailGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const activeImage = selectedImage && images.includes(selectedImage) ? selectedImage : images[0];
  const thumbnails = images.slice(0, 4);
  const hasThumbnails = images.length > 1;

  const thumbnail = (image: string, index: number) => (
    <button
      type="button"
      className={`${styles.thumbButton} ${activeImage === image ? styles.thumbButtonActive : ""}`}
      aria-label={`Показать фото ${index + 1}`}
      aria-pressed={activeImage === image}
      onClick={() => setSelectedImage(image)}
      key={`${image}-${index}`}
    >
      <Image
        alt=""
        className={styles.thumbImage}
        fill
        loading="lazy"
        sizes="(max-width: 920px) 22vw, 140px"
        src={image}
      />
    </button>
  );

  return (
    <div
      className={`${styles.gallery} ${hasThumbnails ? "" : styles.singleGallery}`}
      style={{ "--thumbnail-count": thumbnails.length } as CSSProperties}
    >
      {hasThumbnails ? (
        <div className={styles.thumbsColumn} role="group" aria-label="Фотографии товара">
          {thumbnails.map(thumbnail)}
        </div>
      ) : null}

      <div className={styles.mainPhoto}>
        {activeImage ? (
          <Image
            alt={`${title} — фото ${images.indexOf(activeImage) + 1}`}
            className={styles.mainImage}
            fill
            priority={activeImage === images[0]}
            sizes="(max-width: 1100px) calc(100vw - 32px), 55vw"
            src={activeImage}
          />
        ) : (
          <ProductPhotoPlaceholder />
        )}
      </div>

      {images.length > 4 ? (
        <div className={styles.morePhotos}>
          <button
            type="button"
            className={styles.moreButton}
            aria-expanded={showAllPhotos}
            onClick={() => setShowAllPhotos((current) => !current)}
          >
            {showAllPhotos ? "Скрыть дополнительные фото" : `Ещё фото: ${images.length - 4}`}
          </button>
          {showAllPhotos ? (
            <div className={styles.additionalPhotos} role="group" aria-label="Дополнительные фотографии товара">
              {images.slice(4).map((image, index) => thumbnail(image, index + 4))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
