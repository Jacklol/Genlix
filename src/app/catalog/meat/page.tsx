import type { CSSProperties } from "react";
import type { Metadata } from "next";

import { FooterInstagramIcon } from "@/components/icons/FooterInstagramIcon";
import { FooterFacebookIcon } from "@/components/icons/FooterFacebookIcon";
import { FooterXIcon } from "@/components/icons/FooterXIcon";
import { FooterYoutubeIcon } from "@/components/icons/FooterYoutubeIcon";
import homeStyles from "@/app/home.module.css";
import styles from "./meat.module.css";

export const metadata: Metadata = {
  title: "Мясо — каталог Genlix",
  description: "Выберите бренд мясной продукции: Primebeef и Мираторг.",
};

const navItems = [
  ["Главная", "/"],
  ["О компании", "/#about"],
  ["Каталог", "/#catalog"],
  ["Партнёры", "/#partners"],
  ["Новости", "/#news"],
  ["Контакты", "/#contacts"],
] as const;

const brands = [
  {
    eyebrow: "Эксклюзивный бренд",
    name: "Primebeef",
    audience: "Для HoReCa и Ритейла",
    text: "Премиум, сухое вызревание, высокая мраморность.",
    href: "/#contacts",
    image: "/assets/home/category1.jpg",
    position: "center",
    size: "cover",
  },
  {
    eyebrow: "Широкий ассортимент",
    name: "Мираторг",
    audience: "Только для Ритейла",
    text: "Доступное качество и готовая упаковка для вашей витрины.",
    href: "/#contacts",
    image: "/assets/home/news_item2.jpg",
    position: "center",
    size: "cover",
  },
] as const;

const footerColumns = [
  {
    title: "Каталог",
    links: [
      ["Мраморная говядина", "/#catalog"],
      ["Фермерская птица", "/#catalog"],
      ["Премиальные соки", "/#catalog"],
      ["Импортная вода", "/#catalog"],
      ["Деликатесы", "/#catalog"],
    ],
  },
  {
    title: "Компания",
    links: [
      ["О компании", "/#about"],
      ["Стандарты качества", "/#about"],
      ["Логистика 24/7", "/#partners"],
      ["Условия оплаты", "/#contacts"],
      ["Контакты", "/#contacts"],
    ],
  },
  {
    title: "Связь",
    links: [
      ["b2b@gildia-dist.ru", "mailto:b2b@gildia-dist.ru"],
      ["+7 (495) 123-45-67", "tel:+74951234567"],
      ["Адрес склада", "/#contacts"],
      ["Заявка на прайс", "/#contacts"],
      ["Telegram-канал", "/#contacts"],
    ],
  },
] as const;

function Brand() {
  return (
    <a className={homeStyles.brand} href="/" aria-label="Genlix — на главную">
      <span aria-hidden="true" />
      <strong>Genlix</strong>
    </a>
  );
}

export default function MeatCatalogPage() {
  return (
    <main className={homeStyles.page}>
      <header className={`${homeStyles.header} ${styles.headerStatic}`}>
        <div className={homeStyles.headerInner}>
          <Brand />
          <nav className={homeStyles.desktopNav} aria-label="Основная навигация">
            {navItems.map(([label, href]) => (
              <a
                className={label === "Каталог" ? homeStyles.activeLink : undefined}
                href={href}
                key={label}
              >
                {label}
              </a>
            ))}
          </nav>
          <div className={homeStyles.headerActions}>
            <a className={homeStyles.phone} href="tel:+74951234567">
              +7 (495) 123-45-67
            </a>
            <a className={homeStyles.primaryButton} href="/#contacts">
              Стать партнёром
            </a>
          </div>
          <details className={homeStyles.mobileMenu}>
            <summary aria-label="Открыть меню">
              <span />
              <span />
              <span />
            </summary>
            <nav aria-label="Мобильная навигация">
              {navItems.map(([label, href]) => (
                <a href={href} key={label}>
                  {label}
                </a>
              ))}
              <a href="tel:+74951234567">+7 (495) 123-45-67</a>
            </nav>
          </details>
        </div>
      </header>

      <section className={styles.main}>
        <div className={homeStyles.shell}>
          <nav className={styles.breadcrumbs} aria-label="Хлебные крошки">
            <a href="/">Главная</a>
            <span aria-hidden="true">›</span>
            <a href="/#catalog">Каталог</a>
            <span aria-hidden="true">›</span>
            <strong>Мясо</strong>
          </nav>

          <div className={styles.pageHeading}>
            <h1>Мясо</h1>
            <p>Выберите бренд для перехода к соответствующему каталогу поставок</p>
          </div>

          <div className={styles.brandGrid}>
            {brands.map((brand) => (
              <a
                className={styles.brandCard}
                href={brand.href}
                key={brand.name}
                style={
                  {
                    "--brand-image": `url("${brand.image}")`,
                    "--brand-position": brand.position,
                    "--brand-size": brand.size,
                  } as CSSProperties
                }
              >
                <div className={styles.brandCopy}>
                  <p className={styles.brandEyebrow}>{brand.eyebrow}</p>
                  <h2 className={styles.brandName}>{brand.name}</h2>
                  <p className={styles.brandAudience}>{brand.audience}</p>
                  <p className={styles.brandText}>{brand.text}</p>
                </div>
                <span className={styles.brandButton}>Перейти</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.subscribeSection} aria-labelledby="subscribe-title">
        <div className={homeStyles.shell}>
          <div className={styles.subscribeGrid}>
            <div className={styles.subscribeHeading}>
              <h2 id="subscribe-title">
                Подпишитесь <span>на обновления</span>
              </h2>
              <p>
                Получайте новости о поставках, сезонных предложениях и обновлениях ассортимента
                для HoReCa и ритейла.
              </p>
            </div>
            <form className={styles.subscribeForm}>
              <input name="email" placeholder="Ваша почта" type="email" />
              <button type="submit">Подписаться</button>
              <a className={styles.subscribeSocial} href="/#contacts" aria-label="Instagram">
                <FooterInstagramIcon />
              </a>
            </form>
          </div>
        </div>
      </section>

      <footer className={homeStyles.footer}>
        <div className={`${homeStyles.shell} ${homeStyles.footerGrid}`}>
          <div className={homeStyles.footerAbout}>
            <Brand />
            <p>
              Импорт и комплексная дистрибуция мяса и премиальных напитков для ресторанных
              холдингов и элитного ритейла.
            </p>
          </div>
          {footerColumns.map((column) => (
            <div className={homeStyles.footerColumn} key={column.title}>
              <h3>{column.title}</h3>
              {column.links.map(([label, href]) => (
                <a href={href} key={label}>
                  {label}
                </a>
              ))}
            </div>
          ))}
        </div>
        <div className={`${homeStyles.shell} ${homeStyles.footerBottom}`}>
          <span>© 2026 ООО «Гильдия Дистрибуция». Все права защищены.</span>
          <p className={homeStyles.footerCredit}>
            <span>Developed by</span>{" "}
            <a href="https://localmindstudio.site/" target="_blank" rel="noopener">
              localmindstudio
            </a>
          </p>
          <div className={homeStyles.footerSocial} aria-label="Социальные сети">
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
    </main>
  );
}
