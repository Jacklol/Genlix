import { officeLocation } from "@/lib/site-data";

import styles from "./YandexMap.module.css";

function buildMapSrc() {
  const { longitude, latitude } = officeLocation;

  return `https://yandex.ru/map-widget/v1/?ll=${longitude},${latitude}&z=17&pt=${longitude},${latitude},pm2rdm`;
}

export function YandexMap() {
  return (
    <iframe
      allowFullScreen
      className={styles.frame}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      src={buildMapSrc()}
      title={`Яндекс карта — ${officeLocation.address}`}
    />
  );
}
