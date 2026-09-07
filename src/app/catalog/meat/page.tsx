import type { Metadata } from "next";

import { UnifiedMeatCatalogPage } from "@/components/UnifiedMeatCatalogPage";
import { parseMeatCatalogFilters } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Мясо — каталог Genlix",
  description:
    "Каталог мяса Genlix для HoReCa и ритейла с подбором по виду, производителю и упаковке.",
};

type MeatCatalogPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MeatCatalogPage({ searchParams }: MeatCatalogPageProps) {
  const initialFilters = parseMeatCatalogFilters(await searchParams);

  return <UnifiedMeatCatalogPage initialFilters={initialFilters} />;
}
