"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";

import homeStyles from "@/app/home.module.css";
import { CatalogSelect } from "@/components/CatalogSelect";
import { MeatCatalogArtwork, type MeatCatalogLayout } from "@/components/MeatCatalogArtwork";
import { MEAT_CATALOG_ARTWORK_VIEWBOX, meatCatalogArtworkRegions } from "@/lib/catalog/meat-catalog-artwork";
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
  mode?: "details" | "filter";
  artwork?: "original" | "catalog";
  selectedCutId?: string | null;
  onCutSelect?: (region: MeatCutRegion) => void;
  onClearSelection?: () => void;
};

export function MeatCutsMap({
  subtitle = "Выберите интересующую часть туши",
  embedded = false,
  mode = "details",
  artwork = "original",
  selectedCutId,
  onCutSelect,
  onClearSelection,
}: MeatCutsMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const mapWrapRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const cutSelectId = useId();
  const mapId = useId();

  const [internalActiveId, setInternalActiveId] = useState<string | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ left: number; top: number } | null>(null);
  const [mapZoomed, setMapZoomed] = useState(false);
  const [bullLayout, setBullLayout] = useState<MeatCatalogLayout>("center");

  const isControlled = selectedCutId !== undefined;
  const catalogArtwork = artwork === "catalog" && mode === "filter";
  const viewBox = catalogArtwork ? MEAT_CATALOG_ARTWORK_VIEWBOX : MEAT_CUTS_VIEWBOX;
  const activeId = isControlled ? selectedCutId : internalActiveId;
  const regions = catalogArtwork ? meatCatalogArtworkRegions : meatCutRegions;
  const activeCut = regions.find(region => region.id === activeId)
    ?? (catalogArtwork ? meatCutRegions.find(region => region.id === activeId) : undefined) ?? null;
  const selectableRegions = activeCut && !regions.some(region => region.id === activeCut.id)
    ? [...regions, activeCut] : regions;

  const selectCut = (region: MeatCutRegion) => {
    if (!isControlled) {
      setInternalActiveId(region.id);
    }

    onCutSelect?.(region);
  };

  const handleSelect = (region: MeatCutRegion, event: ReactMouseEvent<SVGElement>) => {
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
    const popupCut = meatCutRegions.find(region => region.id === activeId);
    if (!popupCut || mode === "filter") {
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

    const centroid = getPolygonCentroid(popupCut.points);

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
  }, [activeId, mode]);

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

  const mapImage = (
    <svg
      ref={svgRef}
      id={mapId}
      aria-label="Интерактивная схема отрубов"
      className={styles.map}
      role="group"
      viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
      preserveAspectRatio="xMidYMid meet"
      onClick={handleMapClick}
    >
      {!catalogArtwork ? (
        <image
          height={MEAT_CUTS_VIEWBOX.height}
          href={MEAT_CUTS_IMAGE}
          preserveAspectRatio="xMidYMid meet"
          width={MEAT_CUTS_VIEWBOX.width}
        />
      ) : null}
      {catalogArtwork ? meatCatalogArtworkRegions.map(region => {
        const isActive = region.id === activeId || Boolean(activeId && region.legacyCutIds?.includes(activeId));
        const { x, y, lines, rotate, fontSize } = region.label;
        return <g key={region.id} role="button" tabIndex={0} aria-label={region.titleRu} aria-pressed={isActive}
          data-cut-id={region.id} className={`${styles.catalogRegion} ${isActive ? styles.catalogRegionActive : ""}`}
          onClick={event => handleSelect(region, event)} onKeyDown={event => {
            if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectCut(region); }
          }}>
          <title>{region.titleRu}</title>
          <path d={region.path} className={styles.catalogRegionShape} />
          <text className={styles.catalogRegionLabel} x={x} y={y}
            transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined}
            style={fontSize ? { fontSize } : undefined} aria-hidden="true">
            {lines.map((line, index) => <tspan key={line} x={x} dy={index === 0 ? `${-(lines.length - 1) * .6}em` : "1.2em"}>{line}</tspan>)}
          </text>
        </g>;
      }) : meatCutRegions.map((region) => {
        if (region.enabled === false) return null;
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
  );

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
      className={[
        styles.section,
        embedded ? styles.embedded : "",
        mode === "filter" ? styles.filterMode : "",
        catalogArtwork ? styles.catalogArtwork : "",
      ].filter(Boolean).join(" ")}
      aria-labelledby="meat-cuts-map-title"
    >
      <div className={catalogArtwork ? styles.catalogInner : embedded ? styles.embeddedInner : homeStyles.shell}>
        <div className={styles.header}>
          <h2 className={styles.title} id="meat-cuts-map-title">
            Интерактивная карта <span>мясных отрубов</span>
          </h2>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>

        <div className={styles.mapLayout}>
          <div className={styles.mapColumn}>
            {catalogArtwork ? <div className={styles.artworkToolbar}>
              <span>Расположение</span>
              <div className={styles.artworkSwitcher} role="group" aria-label="Расположение быка">
                <button type="button" aria-label="Вариант 1: По центру" title="По центру"
                  aria-pressed={bullLayout === "center"} onClick={() => setBullLayout("center")}>1</button>
                <button type="button" aria-label="Вариант 2: Со смещением" title="Со смещением"
                  aria-pressed={bullLayout === "offset"} onClick={() => setBullLayout("offset")}>2</button>
              </div>
              <span className={styles.artworkLayoutName}>{bullLayout === "center" ? "По центру" : "Со смещением"}</span>
            </div> : null}
            <div className={styles.mapWrap} ref={mapWrapRef} data-zoomed={mapZoomed || undefined}>
              {catalogArtwork ? <MeatCatalogArtwork zoomed={mapZoomed} layout={bullLayout}>{mapImage}</MeatCatalogArtwork> : mapImage}

              {activeCut && mode === "details" ? (
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

            {catalogArtwork ? <div className={styles.mapTools}>
              <button type="button" aria-controls={mapId} aria-pressed={mapZoomed}
                onClick={() => setMapZoomed(zoomed => !zoomed)}>{mapZoomed ? "Показать целиком" : "Увеличить схему"}</button>
              {mapZoomed ? <p>Сдвигайте схему в стороны и нажмите на нужный отруб.</p> : null}
            </div> : null}

            {activeCut && mode === "details" ? (
              <aside className={styles.detailsPopupBelow} aria-live="polite">
                {detailsContent}
              </aside>
            ) : null}

            {mode === "filter" ? (
              <div className={styles.cutSelector}>
                <label htmlFor={cutSelectId}>Часть туши</label>
                <CatalogSelect
                  id={cutSelectId}
                  label="Часть туши"
                  emptyLabel="Все отрубы"
                  variant="dark"
                  chevronSrc={catalogArtwork ? "/assets/catalog/meat/catalog-hero/select-chevron.svg" : undefined}
                  options={selectableRegions.filter((region) => region.enabled !== false).map((region) => ({
                    value: region.id, label: catalogArtwork ? region.titleRu : `${region.titleRu} / ${region.titleEn}`,
                  }))}
                  value={activeId ?? ""}
                  onChange={(value) => {
                    const region = selectableRegions.find((cut) => cut.id === value);
                    if (region) {
                      selectCut(region);
                    } else {
                      setInternalActiveId(null);
                      onClearSelection?.();
                    }
                  }}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
