import type { ReactNode } from "react";
import { MeatCatalogFrame } from "@/components/UnifiedMeatCatalogPage";

export default function MeatCatalogLayout({ children }: { children: ReactNode }) {
  return <MeatCatalogFrame>{children}</MeatCatalogFrame>;
}
