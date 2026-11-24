import type { ReactNode } from "react";
import { HomeExperience } from "@/components/HomeExperience";
import styles from "@/app/home.module.css";

export default function HomeLayout({ children }: { children: ReactNode }) {
  return (
    <main className={styles.page} id="top">
      <HomeExperience />
      {children}
    </main>
  );
}
