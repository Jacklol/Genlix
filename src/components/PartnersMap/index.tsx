"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";

import { PartnersMapMarkerIcon } from "@/components/icons/PartnersMapMarkerIcon";
import {
  partnerLocations,
  PARTNERS_MAP_IMAGE,
  PARTNERS_MAP_VIEWBOX,
  type PartnerLocation,
} from "@/lib/partners-locations";

import styles from "./PartnersMap.module.css";

function LocationPopup({ location }: { location: PartnerLocation }) {
  return (
    <>
      <h3 className={styles.popupTitle}>{location.name}</h3>
      <dl className={styles.fieldList}>
        <div className={styles.field}>
          <dt className={styles.fieldLabel}>Адрес</dt>
          <dd className={styles.fieldValue}>{location.address}</dd>
        </div>
        {location.website ? (
          <div className={styles.field}>
            <dt className={styles.fieldLabel}>Сайт</dt>
            <dd className={styles.fieldValue}>
              {location.websiteUrl ? (
                <a href={location.websiteUrl} rel="noreferrer" target="_blank">
                  {location.website}
                </a>
              ) : (
                location.website
              )}
            </dd>
          </div>
        ) : null}
        {location.instagram ? (
          <div className={styles.field}>
            <dt className={styles.fieldLabel}>Instagram</dt>
            <dd className={styles.fieldValue}>
              {location.instagramUrl ? (
                <a href={location.instagramUrl} rel="noreferrer" target="_blank">
                  {location.instagram}
                </a>
              ) : (
                location.instagram
              )}
            </dd>
          </div>
        ) : null}
      </dl>
      <div className={styles.actions}>
        {location.websiteUrl ? (
          <a className={styles.primaryAction} href={location.websiteUrl} rel="noreferrer" target="_blank">
            Перейти на сайт
          </a>
        ) : null}
        {location.instagramUrl ? (
          <a className={styles.secondaryAction} href={location.instagramUrl} rel="noreferrer" target="_blank">
            Instagram
          </a>
        ) : null}
      </div>
    </>
  );
}

export function PartnersMap() {
  const mapWrapRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ left: number; top: number } | null>(null);

  const activeLocation = partnerLocations.find((location) => location.id === activeId) ?? null;

  const handleSelect = (location: PartnerLocation) => {
    setActiveId((currentId) => (currentId === location.id ? null : location.id));
  };

  const handleMapClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    const target = event.target as Element;

    if (target.closest("button")) {
      return;
    }

    setActiveId(null);
  };

  const updatePopupPosition = useCallback(() => {
    if (!activeLocation) {
      setPopupPosition(null);
      return;
    }

    if (window.matchMedia("(max-width: 920px)").matches) {
      setPopupPosition(null);
      return;
    }

    const wrap = mapWrapRef.current;

    if (!wrap) {
      setPopupPosition(null);
      return;
    }

    const anchorLeft = (activeLocation.x / 100) * wrap.clientWidth;
    const anchorTop = (activeLocation.y / 100) * wrap.clientHeight;
    const popup = popupRef.current;
    const popupWidth = popup?.offsetWidth ?? 320;
    const popupHeight = popup?.offsetHeight ?? 220;
    const offsetX = 24;

    const left = Math.min(
      Math.max(anchorLeft + offsetX, 12),
      wrap.clientWidth - popupWidth - 12,
    );
    const top = Math.min(
      Math.max(anchorTop, popupHeight / 2 + 12),
      wrap.clientHeight - popupHeight / 2 - 12,
    );

    setPopupPosition({ left, top });
  }, [activeLocation]);

  useLayoutEffect(() => {
    updatePopupPosition();
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

  return (
    <div className={styles.root}>
      <div className={styles.mapWrap} ref={mapWrapRef} onClick={handleMapClick}>
        <img
          alt="Карта ресторанов и магазинов Primebeef в Беларуси"
          className={styles.mapImage}
          height={PARTNERS_MAP_VIEWBOX.height}
          src={PARTNERS_MAP_IMAGE}
          width={PARTNERS_MAP_VIEWBOX.width}
        />

        <div className={styles.markers}>
          {partnerLocations.map((location) => {
            const isActive = location.id === activeId;

            return (
              <button
                aria-label={location.name}
                className={`${styles.marker} ${isActive ? styles.markerActive : ""}`.trim()}
                key={location.id}
                style={{ left: `${location.x}%`, top: `${location.y}%` }}
                type="button"
                onClick={() => handleSelect(location)}
              >
                <span className={styles.markerBadge}>
                  <PartnersMapMarkerIcon />
                </span>
              </button>
            );
          })}
        </div>

        {activeLocation ? (
          <aside
            ref={popupRef}
            className={`${styles.popup} ${popupPosition ? styles.popupVisible : ""}`.trim()}
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
            <LocationPopup location={activeLocation} />
          </aside>
        ) : null}
      </div>

      {activeLocation ? (
        <aside className={styles.popupBelow} aria-live="polite">
          <LocationPopup location={activeLocation} />
        </aside>
      ) : null}
    </div>
  );
}
