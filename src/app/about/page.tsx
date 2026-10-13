import type { Metadata } from "next";

import { AboutVariants, AboutVariantSwitcher, type AboutVariant } from "@/components/AboutVariants";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import homeStyles from "@/app/home.module.css";
import variantStyles from "@/components/AboutVariants/AboutVariants.module.css";

import { OriginalAboutContent } from "./OriginalAboutContent";

export const metadata: Metadata = {
  title: "О компании — Genlix",
  description: "Genlix — поставщик продуктов питания для HoReCa и ритейла в Беларуси. О компании, сотрудничестве и социальных проектах.",
  alternates: { canonical: "/about" },
};

type AboutPageProps = {
  searchParams: Promise<{ variant?: string | string[] }>;
};

export default async function AboutPage({ searchParams }: AboutPageProps) {
  const { variant: requestedVariant } = await searchParams;
  const variant: AboutVariant = requestedVariant === "original" || requestedVariant === "2" || requestedVariant === "3"
    ? requestedVariant
    : "1";

  return (
    <main className={`${homeStyles.page} ${variant === "original" ? "" : variantStyles.brandPage}`}>
      <Header activeLink="О компании" static />
      <AboutVariantSwitcher variant={variant} />
      {variant === "original" ? <OriginalAboutContent /> : <AboutVariants variant={variant} />}
      <Footer />
    </main>
  );
}
