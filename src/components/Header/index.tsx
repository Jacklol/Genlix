import { Brand } from "@/components/Brand";
import { navItems } from "@/lib/site-data";

import styles from "./Header.module.css";

type HeaderProps = {
  activeLink?: (typeof navItems)[number]["label"];
  static?: boolean;
};

export function Header({ activeLink = "Главная", static: isStatic = false }: HeaderProps) {
  return (
    <header className={`${styles.header} ${isStatic ? styles.static : ""}`}>
      <div className={styles.inner}>
        <Brand href={activeLink === "Главная" ? "#top" : "/"} />
        <nav className={styles.desktopNav} aria-label="Основная навигация">
          {navItems.map(({ label, href }) => (
            <a
              className={label === activeLink ? styles.activeLink : undefined}
              href={href}
              key={label}
            >
              {label}
            </a>
          ))}
        </nav>
        <div className={styles.actions}>
          <a className={styles.phone} href="tel:+74951234567">
            +7 (495) 123-45-67
          </a>
          <a className={styles.cta} href="/#contacts">
            Стать партнёром
          </a>
        </div>
        <details className={styles.mobileMenu}>
          <summary aria-label="Открыть меню">
            <span />
            <span />
            <span />
          </summary>
          <nav aria-label="Мобильная навигация">
            {navItems.map(({ label, href }) => (
              <a href={href} key={label}>
                {label}
              </a>
            ))}
            <a href="tel:+74951234567">+7 (495) 123-45-67</a>
          </nav>
        </details>
      </div>
    </header>
  );
}
