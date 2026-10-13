import type { Metadata } from "next";

import { ContactsExperience } from "@/components/ContactsExperience";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import homeStyles from "@/app/home.module.css";
import styles from "@/components/ContactsExperience/ContactsExperience.module.css";

export const metadata: Metadata = {
  title: "Контакты — Genlix",
  description: "Свяжитесь с Genlix: сотрудничество, поставки, логистика и заявка на партнёрство.",
  alternates: { canonical: "/contacts" },
};

export default function ContactsPage() {
  return (
    <main className={`${homeStyles.page} ${styles.page}`} id="top">
      <Header activeLink="Контакты" static />
      <ContactsExperience />
      <Footer />
    </main>
  );
}
