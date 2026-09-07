"use client";

import { useState } from "react";

import { Header } from "@/components/Header";
import { HomeHero, type HomeHeroVariant } from "@/components/HomeHero";

type HomeExperienceProps = {
  showVersionSwitch?: boolean;
};

export function HomeExperience({ showVersionSwitch = false }: HomeExperienceProps) {
  const [variant, setVariant] = useState<HomeHeroVariant>(1);

  const selectVariant = (nextVariant: HomeHeroVariant) => {
    setVariant(nextVariant);
  };

  return (
    <>
      <Header
        overlay
        heroVariant={showVersionSwitch ? variant : undefined}
        onHeroVariantChange={showVersionSwitch ? selectVariant : undefined}
      />
      <HomeHero variant={variant} />
    </>
  );
}
