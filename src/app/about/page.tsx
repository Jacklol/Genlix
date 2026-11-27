import type { Metadata } from "next";

import { AboutVariants, type AboutVariant } from "@/components/AboutVariants";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PageVariant } from "@/components/PageVariants";
import { aboutLooks } from "@/components/PageVariants/aboutLooks";
import { VariantPicker } from "@/components/PageVariants/VariantPicker";
import { aboutChoices } from "@/components/PageVariants/routes";
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
  const index = aboutChoices.findIndex((choice) => choice.value === requestedVariant);
  const variant = aboutChoices[index]?.value ?? "1";
  const look = index >= 4 ? aboutLooks[index - 4] : undefined;
  const existingVariant = variant as Exclude<AboutVariant, "original">;

  return (
    <main className={`${homeStyles.page} ${variant === "original" || look ? "" : variantStyles.brandPage}`}>
      <Header activeLink="О компании" static />
      <VariantPicker page="about" value={variant} choices={aboutChoices} />
      {look ? <PageVariant key={variant} page="about" look={look} /> : variant === "original" ? <OriginalAboutContent /> : <AboutVariants variant={existingVariant} />}
      <Footer />
    </main>
  );
}
