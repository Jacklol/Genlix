"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";

import homeStyles from "@/app/home.module.css";
import {
  MEAT_CUTS_IMAGE,
  MEAT_CUTS_VIEWBOX,
  meatCutRegions,
  type MeatCutRegion,
} from "@/lib/meat-cuts";

import { getPolygonCentroid, viewBoxPointToContainer } from "./map-utils";
import styles from "./MeatCutsMap.module.css";

type MeatCutsMapProps = {
  subtitle?: string;
  embedded?: boolean;
  selectedCutId?: string | null;
  onCutSelect?: (region: MeatCutRegion) => void;
  onClearSelection?: () => void;
};

export function MeatCutsMap({
  subtitle = "Выберите интересующую часть туши",
  embedded = false,
  selectedCutId,
  onCutSelect,
  onClearSelection,
}: MeatCutsMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const mapWrapRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const [internalActiveId, setInternalActiveId] = useState<string | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ left: number; top: number } | null>(null);

  const isControlled = selectedCutId !== undefined;
  const activeId = isControlled ? selectedCutId : internalActiveId;
  const activeCut = meatCutRegions.find((region) => region.id === activeId) ?? null;

  const selectCut = (region: MeatCutRegion) => {
    if (!isControlled) {
      setInternalActiveId(region.id);
    }

    onCutSelect?.(region);
  };

  const handleSelect = (region: MeatCutRegion, event: ReactMouseEvent<SVGPolygonElement>) => {
    event.stopPropagation();
    selectCut(region);
  };

  const handleMapClick = (event: ReactMouseEvent<SVGSVGElement>) => {
    const target = event.target as Element;

    if (target.tagName.toLowerCase() === "polygon") {
      return;
    }

    if (!isControlled) {
      setInternalActiveId(null);
    }

    onClearSelection?.();
  };

  const updatePopupPosition = useCallback(() => {
    if (!activeCut) {
      setPopupPosition(null);
      return;
    }

    if (window.matchMedia("(max-width: 920px)").matches) {
      setPopupPosition(null);
      return;
    }

    const svg = svgRef.current;
    const wrap = mapWrapRef.current;

    if (!svg || !wrap) {
      setPopupPosition(null);
      return;
    }

    const centroid = getPolygonCentroid(activeCut.points);

    if (!centroid) {
      setPopupPosition(null);
      return;
    }

    const anchor = viewBoxPointToContainer(svg, wrap, centroid);

    if (!anchor) {
      setPopupPosition(null);
      return;
    }

    const popup = popupRef.current;
    const popupWidth = popup?.offsetWidth ?? 280;
    const popupHeight = popup?.offsetHeight ?? 180;
    const offsetX = 20;

    const left = Math.min(
      Math.max(anchor.left + offsetX, 12),
      wrap.clientWidth - popupWidth - 12,
    );
    const top = Math.min(
      Math.max(anchor.top, popupHeight / 2 + 12),
      wrap.clientHeight - popupHeight / 2 - 12,
    );

    setPopupPosition({ left, top });
  }, [activeCut]);

  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(updatePopupPosition);

    return () => window.cancelAnimationFrame(frame);
  }, [updatePopupPosition]);

  useEffect(() => {
    const wrap = mapWrapRef.current;

    if (!wrap) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      updatePopupPosition();
    });

    resizeObserver.observe(wrap);
    window.addEventListener("resize", updatePopupPosition);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updatePopupPosition);
    };
  }, [updatePopupPosition]);

  const detailsContent = activeCut ? (
    <>
      <p className={styles.detailsKicker}>
        {activeCut.titleRu} / {activeCut.titleEn}
      </p>
      <h3 className={styles.detailsTitle}>{activeCut.titleRu}</h3>
      <p className={styles.detailsText}>{activeCut.description}</p>

      {onCutSelect ? (
        <button
          className={styles.detailsLink}
          type="button"
          style={{ padding: 0, border: 0, background: "none", cursor: "pointer" }}
          onClick={() => onCutSelect(activeCut)}
        >
          Показать ассортимент
        </button>
      ) : activeCut.productSlug ? (
        <Link className={styles.detailsLink} href={`/catalog/product/${activeCut.productSlug}`}>
          Смотреть в каталоге
        </Link>
      ) : (
        <p className={styles.detailsNote}>Позиция скоро появится в каталоге</p>
      )}
    </>
  ) : null;

  return (
    <section
      className={`${styles.section} ${embedded ? styles.embedded : ""}`.trim()}
      aria-labelledby="meat-cuts-map-title"
    >
      <div className={embedded ? styles.embeddedInner : homeStyles.shell}>
        <div className={styles.header}>
          <h2 className={styles.title} id="meat-cuts-map-title">
            Интерактивная карта <span>мясных отрубов</span>
          </h2>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>

        <div className={styles.mapLayout}>
          <div className={styles.mapColumn}>
            <div className={styles.mapWrap} ref={mapWrapRef}>
              <svg
                ref={svgRef}
                aria-label="Интерактивная схема отрубов"
                className={styles.map}
                role="img"
                viewBox={`0 0 ${MEAT_CUTS_VIEWBOX.width} ${MEAT_CUTS_VIEWBOX.height}`}
                onClick={handleMapClick}
              >
                <image
                  height={MEAT_CUTS_VIEWBOX.height}
                  href={MEAT_CUTS_IMAGE}
                  preserveAspectRatio="xMidYMid meet"
                  width={MEAT_CUTS_VIEWBOX.width}
                />

                {meatCutRegions.map((region) => {
                  if (region.enabled === false) {
                    return null;
                  }

                  const isActive = region.id === activeId;

                  return (
                    <polygon
                      aria-label={`${region.titleRu} / ${region.titleEn}`}
                      aria-pressed={isActive}
                      className={`${styles.region} ${isActive ? styles.regionActive : ""}`}
                      key={region.id}
                      points={region.points}
                      role="button"
                      tabIndex={0}
                      onClick={(event) => handleSelect(region, event)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          selectCut(region);
                        }
                      }}
                    />
                  );
                })}
              </svg>

              {activeCut ? (
                <aside
                  ref={popupRef}
                  className={`${styles.detailsPopup} ${popupPosition ? styles.detailsPopupVisible : ""}`.trim()}
                  aria-live="polite"
                  style={
                    popupPosition
                      ? {
                          left: popupPosition.left,
                          top: popupPosition.top,
                        }
                      : undefined
                  }
                >
                  {detailsContent}
                </aside>
              ) : null}
            </div>

            {activeCut ? (
              <aside className={styles.detailsPopupBelow} aria-live="polite">
                {detailsContent}
              </aside>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
