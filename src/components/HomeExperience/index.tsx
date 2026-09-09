"use client";

import { useState } from "react";

import { Header } from "@/components/Header";
import { HomeHero, type HomeHeroVariant } from "@/components/HomeHero";

export function HomeExperience() {
  const [variant, setVariant] = useState<HomeHeroVariant>(1);

  const selectVariant = (nextVariant: HomeHeroVariant) => {
    setVariant(nextVariant);
  };

  return (
    <>
      <Header
        overlay
        heroVariant={variant}
        onHeroVariantChange={selectVariant}
      />
      <HomeHero variant={variant} />
    </>
  );
}
