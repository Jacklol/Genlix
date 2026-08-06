import type { CSSProperties } from "react";
import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { FooterInstagramIcon } from "@/components/icons/FooterInstagramIcon";
import homeStyles from "@/app/home.module.css";
import styles from "./meat.module.css";

export const metadata: Metadata = {
  title: "Мясо — каталог Genlix",
  description: "Выберите бренд мясной продукции: Primebeef и Мираторг.",
};

const brands = [
  {
    eyebrow: "Эксклюзивный бренд",
    name: "Primebeef",
    audience: "Для HoReCa и Ритейла",
    text: "Премиум, сухое вызревание, высокая мраморность.",
    href: "/catalog/meat/primebeef",
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

export default function MeatCatalogPage() {
  return (
    <main className={homeStyles.page}>
      <Header activeLink="Каталог" static />

      <Breadcrumbs
        items={[
          { label: "Главная", href: "/" },
          { label: "Каталог", href: "/#catalog" },
          { label: "Мясо" },
        ]}
      />

      <section className={styles.main}>
        <div className={homeStyles.shell}>
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

      <Footer />
    </main>
  );
}
