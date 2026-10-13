import Image from "next/image";
import type { ReactNode } from "react";

import styles from "./MeatCatalogArtwork.module.css";

export type MeatCatalogLayout = "center" | "offset";

/** The clean bull and vector cut zones share one coordinate system. */
export function MeatCatalogArtwork({ children, zoomed = false, layout = "center" }: {
  children?: ReactNode;
  zoomed?: boolean;
  layout?: MeatCatalogLayout;
}) {
  return (
    <div className={styles.artwork} data-meat-catalog-artwork data-bull-layout={layout}>
      <p className={styles.title} aria-hidden="true">Говядина</p>
      <div className={styles.subject} data-bull-subject>
        <Image
          alt=""
          className={styles.bull}
          src="/assets/catalog/meat/catalog-hero/bull-clean.png"
          width={1681}
          height={936}
          sizes={zoomed ? "900px" : "(max-width: 600px) 100vw, (max-width: 1920px) 90vw, 1728px"}
          quality={90}
          preload
        />
        {children}
      </div>
    </div>
  );
}
