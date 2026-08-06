import homeStyles from "@/app/home.module.css";
import { Brand } from "@/components/Brand";
import { FooterFacebookIcon } from "@/components/icons/FooterFacebookIcon";
import { FooterInstagramIcon } from "@/components/icons/FooterInstagramIcon";
import { FooterXIcon } from "@/components/icons/FooterXIcon";
import { FooterYoutubeIcon } from "@/components/icons/FooterYoutubeIcon";
import { footerColumns } from "@/lib/site-data";

import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`${homeStyles.shell} ${styles.grid}`}>
        <div className={styles.about}>
          <Brand />
          <p>
            Импорт и комплексная дистрибуция мяса и премиальных напитков для ресторанных
            холдингов и элитного ритейла.
          </p>
        </div>
        {footerColumns.map((column) => (
          <div className={styles.column} key={column.title}>
            <h3>{column.title}</h3>
            {column.links.map(({ label, href }) => (
              <a href={href} key={label}>
                {label}
              </a>
            ))}
          </div>
        ))}
      </div>
      <div className={`${homeStyles.shell} ${styles.bottom}`}>
        <span>© 2026 ООО «Гильдия Дистрибуция». Все права защищены.</span>
        <p className={styles.credit}>
          <span>Developed by</span>{" "}
          <a href="https://localmindstudio.site/" target="_blank" rel="noopener">
            localmindstudio
          </a>
        </p>
        <div className={styles.social} aria-label="Социальные сети">
          <a href="/#contacts" aria-label="Instagram">
            <FooterInstagramIcon />
          </a>
          <a href="/#contacts" aria-label="Facebook">
            <FooterFacebookIcon />
          </a>
          <a href="/#contacts" aria-label="X">
            <FooterXIcon />
          </a>
          <a href="/#contacts" aria-label="YouTube">
            <FooterYoutubeIcon />
          </a>
        </div>
      </div>
    </footer>
  );
}
