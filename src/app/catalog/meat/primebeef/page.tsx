import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PartnersSection } from "@/components/PartnersSection";
import { PrimebeefCatalogExperience } from "@/components/PrimebeefCatalogExperience";
import { SubscribeSection } from "@/components/SubscribeSection";
import {
  getPrimebeefHorecaMeatItems,
  getPrimebeefRetailMeatItems,
} from "@/lib/catalog";
import homeStyles from "@/app/home.module.css";

export const metadata: Metadata = {
  title: "Primebeef — каталог Genlix",
  description: "Primebeef — мясо для профессионалов и гурманов.",
};

export default function PrimebeefPage() {
  return (
    <main className={homeStyles.page}>
      <Header activeLink="Каталог" static />

      <Breadcrumbs
        items={[
          { label: "Главная", href: "/" },
          { label: "Каталог", href: "/#catalog" },
          { label: "Мясо", href: "/catalog/meat" },
          { label: "Primebeef" },
        ]}
      />

      <PrimebeefCatalogExperience
        horecaProducts={getPrimebeefHorecaMeatItems()}
        retailProducts={getPrimebeefRetailMeatItems()}
      />

      <PartnersSection />
      <SubscribeSection />
      <Footer />
    </main>
  );
}
