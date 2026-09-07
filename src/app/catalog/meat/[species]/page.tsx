import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { UnifiedMeatCatalogPage } from "@/components/UnifiedMeatCatalogPage";
import { parseMeatCatalogFilters, type MeatSpecies } from "@/lib/catalog";

export const dynamic = "force-dynamic";

type DedicatedSpecies = Extract<MeatSpecies, "beef" | "lamb">;

type MeatSpeciesPageProps = {
  params: Promise<{ species: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const speciesMetadata: Record<DedicatedSpecies, Metadata> = {
  beef: {
    title: "Говядина — каталог Genlix",
    description: "Каталог говядины Genlix для HoReCa и розничных сетей.",
  },
  lamb: {
    title: "Баранина — каталог Genlix",
    description: "Каталог баранины Genlix для HoReCa и розничных сетей.",
  },
};

function isDedicatedSpecies(value: string): value is DedicatedSpecies {
  return value === "beef" || value === "lamb";
}

export function generateStaticParams() {
  return [{ species: "beef" }, { species: "lamb" }];
}

export async function generateMetadata({ params }: MeatSpeciesPageProps): Promise<Metadata> {
  const { species } = await params;
  return isDedicatedSpecies(species) ? speciesMetadata[species] : {};
}

export default async function MeatSpeciesPage({ params, searchParams }: MeatSpeciesPageProps) {
  const { species } = await params;

  if (!isDedicatedSpecies(species)) {
    notFound();
  }

  const initialFilters = {
    ...parseMeatCatalogFilters(await searchParams),
    species,
  };

  return <UnifiedMeatCatalogPage initialFilters={initialFilters} speciesPage={species} />;
}
