"use client";

import { useRef, useState } from "react";

import homeStyles from "@/app/home.module.css";
import { MeatCatalogBrowser } from "@/components/MeatCatalogBrowser";
import { MeatCutsMap } from "@/components/MeatCutsMap";
import type { MeatCatalogItem } from "@/lib/catalog";
import type { MeatCutRegion } from "@/lib/meat-cuts";

import styles from "./PrimebeefCatalogExperience.module.css";

type Audience = "horeca" | "retail";

type PrimebeefCatalogExperienceProps = {
  horecaProducts: MeatCatalogItem[];
  retailProducts: MeatCatalogItem[];
};

const audienceTabs: Array<{
  id: Audience;
  title: string;
  description: string;
}> = [
  {
    id: "horeca",
    title: "Для HoReCa",
    description: "Отрубы и стейки для ресторанов, шеф-поваров и профессиональной кухни",
  },
  {
    id: "retail",
    title: "Для ритейла",
    description: "Готовая продукция для торговых сетей и розничных магазинов",
  },
];

export function PrimebeefCatalogExperience({
  horecaProducts,
  retailProducts,
}: PrimebeefCatalogExperienceProps) {
  const [audience, setAudience] = useState<Audience>("horeca");
  const [selectedCut, setSelectedCut] = useState<MeatCutRegion | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const selectAudience = (nextAudience: Audience) => {
    setAudience(nextAudience);
    setSelectedCut(null);
  };

  const handleCutSelect = (cut: MeatCutRegion) => {
    setAudience("horeca");
    setSelectedCut(cut);

    window.requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const products = audience === "horeca" ? horecaProducts : retailProducts;

  return (
    <>
      <section className={styles.splitHero} aria-label="Primebeef и карта мясных отрубов">
        <div className={styles.heroPane}>
          <div className={styles.heroCopy}>
            <p className={styles.brandBadge}>
              <strong>Primebeef</strong>
            </p>
            <h1 id="primebeef-title">
              Primebeef — мясо для
              <br />
              профессионалов и гурманов
            </h1>
            <p className={styles.heroLead}>
              Премиальная говядина для ресторанов, шеф-поваров и торговых сетей.
              <br />
              Крупные отрубы для HoReCa и порционная упаковка для ритейла.
            </p>
          </div>
        </div>

        <div className={styles.cutsPane}>
          <MeatCutsMap
            embedded
            selectedCutId={selectedCut?.id ?? null}
            subtitle="Выберите часть туши — мы покажем подходящие позиции ниже"
            onClearSelection={() => setSelectedCut(null)}
            onCutSelect={handleCutSelect}
          />
        </div>
      </section>

      <section className={styles.audienceSection} aria-labelledby="primebeef-audience-title">
        <div className={homeStyles.shell}>
          <div className={styles.audienceHeader}>
            <p className={styles.eyebrow}>Формат сотрудничества</p>
            <h2 id="primebeef-audience-title">Выберите направление</h2>
          </div>

          <div className={styles.tabs} role="tablist" aria-label="Направление поставок">
            {audienceTabs.map((tab) => {
              const isActive = audience === tab.id;

              return (
                <button
                  aria-controls="primebeef-catalog-panel"
                  aria-selected={isActive}
                  className={`${styles.tab} ${isActive ? styles.tabActive : ""}`}
                  id={`primebeef-${tab.id}-tab`}
                  key={tab.id}
                  role="tab"
                  type="button"
                  onClick={() => selectAudience(tab.id)}
                >
                  <strong>{tab.title}</strong>
                  <span>{tab.description}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <div
        aria-labelledby={`primebeef-${audience}-tab`}
        id="primebeef-catalog-panel"
        role="tabpanel"
      >
        <div className={styles.resultsAnchor} ref={resultsRef}>
          <MeatCatalogBrowser
            activeCut={
              selectedCut
                ? {
                    id: selectedCut.id,
                    label: selectedCut.titleRu,
                  }
                : null
            }
            id="primebeef-products"
            key={audience}
            products={products}
            subtitle={
              audience === "horeca"
                ? "Профессиональные форматы поставки Primebeef для кухни и ресторанного сервиса."
                : "Порционная продукция Primebeef для удобной выкладки и стабильной розничной продажи."
            }
            title={audience === "horeca" ? "Ассортимент для HoReCa" : "Ассортимент для ритейла"}
            onClearCut={() => setSelectedCut(null)}
          />
        </div>
      </div>
    </>
  );
}
