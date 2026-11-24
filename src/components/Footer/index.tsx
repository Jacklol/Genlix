import homeStyles from "@/app/home.module.css";
import { Brand } from "@/components/Brand";
import { SiteLink } from "@/components/SiteLink";
import { FooterFacebookIcon } from "@/components/icons/FooterFacebookIcon";
import { FooterInstagramIcon } from "@/components/icons/FooterInstagramIcon";
import { FooterYoutubeIcon } from "@/components/icons/FooterYoutubeIcon";
import { footerColumns, footerCompanyInfo } from "@/lib/site-data";

import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`${homeStyles.shell} ${styles.grid}`}>
        <div className={styles.about}>
          <Brand />
          <p className={styles.companyInfo}>
            {footerCompanyInfo.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </p>
          <div className={styles.social} aria-label="Социальные сети">
            <SiteLink href="/#contacts" aria-label="Instagram">
              <FooterInstagramIcon />
            </SiteLink>
            <SiteLink href="/#contacts" aria-label="Facebook">
              <FooterFacebookIcon />
            </SiteLink>
            <SiteLink href="/#contacts" aria-label="YouTube">
              <FooterYoutubeIcon />
            </SiteLink>
          </div>
        </div>
        {footerColumns.map((column) => (
          <div className={styles.column} key={column.title}>
            <h3>{column.title}</h3>
            {column.links.map(({ label, href }) => (
              <SiteLink href={href} key={label} prefetch={column.title === "Каталог" ? undefined : false}>
                {label}
              </SiteLink>
            ))}
          </div>
        ))}
      </div>
      <div className={`${homeStyles.shell} ${styles.bottom}`}>
        <div className={styles.legal}>
          <span>© 2026 «Genlix». Все права защищены.</span>
        </div>
        <SiteLink href="/privacy" prefetch={false}>Политика конфиденциальности</SiteLink>
        <p className={styles.credit}>
          <span>Developed by</span>{" "}
          <a href="https://localmindstudio.site/" target="_blank" rel="noopener">
            localmindstudio
          </a>
        </p>
      </div>
    </footer>
  );
}
