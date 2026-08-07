import homeStyles from "@/app/home.module.css";

import styles from "./CommercialProposalSection.module.css";

type CommercialProposalSectionProps = {
  href?: string;
};

export function CommercialProposalSection({ href = "#" }: CommercialProposalSectionProps) {
  return (
    <section
      className={`${styles.section} ${homeStyles.pageFooterAnchor}`}
      aria-labelledby="commercial-proposal-title"
    >
      <div className={styles.inner}>
        <h2 className={styles.title} id="commercial-proposal-title">
          Коммерческое предложение
        </h2>
        <a className={styles.button} href={href}>
          Скачать КП
        </a>
      </div>
    </section>
  );
}
