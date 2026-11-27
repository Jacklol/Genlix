import type { Metadata } from "next";

import { ContactsExperience } from "@/components/ContactsExperience";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PageVariant } from "@/components/PageVariants";
import { contactLooks } from "@/components/PageVariants/contactLooks";
import { VariantPicker } from "@/components/PageVariants/VariantPicker";
import { contactChoices } from "@/components/PageVariants/routes";
import homeStyles from "@/app/home.module.css";
import styles from "@/components/ContactsExperience/ContactsExperience.module.css";

export const metadata: Metadata = {
  title: "Контакты — Genlix",
  description: "Свяжитесь с Genlix: сотрудничество, поставки, логистика и заявка на партнёрство.",
  alternates: { canonical: "/contacts" },
};

type ContactsPageProps = { searchParams: Promise<{ variant?: string | string[] }> };

export default async function ContactsPage({ searchParams }: ContactsPageProps) {
  const { variant: requested } = await searchParams;
  const value = contactChoices.find((choice) => choice.value === requested)?.value ?? "original";
  const look = value === "original" ? undefined : contactLooks[Number(value) - 1];
  return (
    <main className={`${homeStyles.page} ${styles.page}`} id="top">
      <Header activeLink="Контакты" static />
      <VariantPicker page="contacts" value={value} choices={contactChoices} />
      {look ? <PageVariant key={value} page="contacts" look={look} /> : <ContactsExperience />}
      <Footer />
    </main>
  );
}
