import homeStyles from "@/app/home.module.css";

import styles from "./PartnersSection.module.css";

const partners = ["Партнер", "Партнер", "Партнер", "Партнер"] as const;

type PartnersSectionProps = {
  brand?: string;
};

export function PartnersSection({ brand = "Primebeef" }: PartnersSectionProps) {
  return (
    <section className={styles.section} aria-labelledby="partners-title">
      <div className={homeStyles.shell}>
        <h2 className={styles.title} id="partners-title">
          Наши партнёры <span>{brand}</span>
        </h2>
        <div className={styles.grid}>
          {partners.map((name, index) => (
            <div className={styles.card} key={`${name}-${index}`}>
              {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
