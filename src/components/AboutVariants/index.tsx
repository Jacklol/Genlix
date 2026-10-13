import Image from "next/image";
import Link from "next/link";

import { ContactRequestModal } from "@/components/ContactRequestModal";
import { catalogSections } from "@/lib/site-data";

import styles from "./AboutVariants.module.css";

export type AboutVariant = "original" | "1" | "2" | "3";

const variants: { value: AboutVariant; label: string }[] = [
  { value: "original", label: "Исходный" },
  { value: "1", label: "1 Светлый" },
  { value: "2", label: "2 Синий" },
  { value: "3", label: "3 Минимум" },
];

const intro = "Genlix — поставщик продуктов питания для ресторанов, гостиниц и розничных сетей в Беларуси.";
const company = "Работаем с 2012 года. Подбираем мясо, птицу и напитки под формат бизнеса и сопровождаем поставки — от выбора продукции до отгрузки.";
const social = "Genlix участвует в социальных проектах и оказывает помощь детским домам, пенсионерам и ветеранам Великой Отечественной войны.";
const responsibility = "Мы осознаём ответственность бизнеса перед обществом и считаем заботу о людях частью своей работы.";

const services = [
  { title: "Ассортимент", text: "Мясо, птица, пиво и вода для вашего меню и торговой полки." },
  { title: "Условия поставки", text: "Согласовываем объём заказа, сроки и условия доставки." },
  { title: "Сопровождение", text: "Помогаем с подбором продукции и сопроводительными документами." },
];

export function AboutVariantSwitcher({ variant }: { variant: AboutVariant }) {
  return (
    <nav className={styles.switcher} aria-label="Варианты страницы о компании">
      <div className={styles.switcherInner}>
        <span className={styles.switcherLabel}>Вариант страницы</span>
        <div className={styles.options}>
          {variants.map(({ value, label }) => (
            <Link
              key={value}
              href={`/about?variant=${value}`}
              className={variant === value ? styles.selected : undefined}
              aria-current={variant === value ? "page" : undefined}
              prefetch={false}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

function Breadcrumb() {
  return (
    <nav className={styles.breadcrumb} aria-label="Хлебные крошки">
      <Link href="/">Главная</Link><span aria-hidden="true">/</span><span aria-current="page">О компании</span>
    </nav>
  );
}

function Photo({ type, className, priority = false }: { type: "warehouse" | "product"; className?: string; priority?: boolean }) {
  return (
    <div className={`${styles.photo} ${className ?? ""}`}>
      <Image
        src={type === "warehouse" ? "/assets/about/control2.png" : "/assets/about/video_cover.png"}
        alt={type === "warehouse" ? "Хранение продукции на складе" : "Работа с мясной продукцией"}
        fill
        sizes="(max-width: 720px) 100vw, (max-width: 1440px) 75vw, 1440px"
        priority={priority}
      />
    </div>
  );
}

function Facts() {
  return (
    <dl className={styles.facts}>
      <div><dt>С 2012 года</dt><dd>Работаем на рынке</dd></div>
      <div><dt>Беларусь</dt><dd>Поставки для бизнеса</dd></div>
      <div><dt>HoReCa и ритейл</dt><dd>Наши направления</dd></div>
    </dl>
  );
}

function ServiceList() {
  return (
    <div className={styles.serviceList}>
      {services.map(({ title, text }) => (
        <div key={title}><h3>{title}</h3><p>{text}</p></div>
      ))}
    </div>
  );
}

function SocialSection() {
  return (
    <section className={styles.social} aria-labelledby="social-title">
      <div className={`${styles.shell} ${styles.socialInner}`}>
        <h2 id="social-title">Социальная<br />ответственность</h2>
        <div><p>{social}</p><p>{responsibility}</p></div>
      </div>
    </section>
  );
}

function Partnership() {
  return (
    <section className={styles.partnership} aria-labelledby="partnership-title">
      <div className={`${styles.shell} ${styles.partnershipInner}`}>
        <div><h2 id="partnership-title">Обсудим сотрудничество</h2><p>Расскажите, какая продукция нужна вашему бизнесу.</p></div>
        <div className={styles.actions}>
          <ContactRequestModal className={styles.primaryButton} label="Стать партнёром" />
          <Link className={styles.textLink} href="/contacts">Контакты</Link>
        </div>
      </div>
    </section>
  );
}

function LightVariant() {
  return (
    <div className={styles.light}>
      <section className={`${styles.shell} ${styles.lightHero}`} aria-labelledby="about-title">
        <Breadcrumb />
        <div className={styles.lightHeading}>
          <div><p className={styles.eyebrow}>О компании Genlix</p><h1 id="about-title">Продукты для<br />вашего бизнеса</h1></div>
          <p className={styles.heroLead}>{intro}</p>
        </div>
        <Photo type="warehouse" className={styles.panorama} priority />
        <Facts />
      </section>

      <section className={`${styles.shell} ${styles.lightWork}`} aria-labelledby="work-title">
        <Photo type="product" className={styles.workPhoto} />
        <div><h2 id="work-title">От выбора продукции<br />до поставки</h2><p className={styles.bodyCopy}>{company}</p><ServiceList /></div>
      </section>
      <SocialSection />
      <Partnership />
    </div>
  );
}

function BlueVariant() {
  return (
    <div className={styles.blue}>
      <section className={styles.blueHero} aria-labelledby="about-title">
        <div className={styles.shell}>
          <Breadcrumb />
          <div className={styles.blueHeroGrid}>
            <div className={styles.blueHeroCopy}>
              <p className={styles.eyebrow}>О компании</p>
              <h1 id="about-title">Genlix для<br />HoReCa и ритейла</h1>
              <p className={styles.heroLead}>{intro}</p>
              <Link className={styles.textLink} href="#about-work">О нашей работе</Link>
            </div>
            <Photo type="product" className={styles.blueHeroPhoto} priority />
          </div>
          <Facts />
        </div>
      </section>

      <section className={`${styles.shell} ${styles.blueWork}`} id="about-work" aria-labelledby="work-title">
        <div className={styles.workHeading}><h2 id="work-title">Поставки под<br />ваш формат</h2><p className={styles.bodyCopy}>{company}</p></div>
        <ServiceList />
        <Photo type="warehouse" className={styles.blueWarehouse} />
      </section>
      <SocialSection />
      <Partnership />
    </div>
  );
}

function MinimalVariant() {
  return (
    <div className={styles.minimal}>
      <section className={`${styles.shell} ${styles.minimalHero}`} aria-labelledby="about-title">
        <Breadcrumb />
        <div className={styles.minimalHeading}>
          <h1 id="about-title">О компании</h1>
          <div><p className={styles.heroLead}>{intro}</p><p className={styles.bodyCopy}>{company}</p></div>
        </div>
        <div className={styles.imagePair}>
          <Photo type="product" priority />
          <Photo type="warehouse" />
        </div>
      </section>

      <div className={`${styles.shell} ${styles.editorial}`}>
        <section className={styles.editorialRow} aria-labelledby="range-title">
          <h2 id="range-title">Ассортимент</h2>
          <div><p>Мясо, птица и напитки для ресторанов, гостиниц и розничных сетей.</p><div className={styles.categoryLinks}>{catalogSections.map(({ label, href }) => <Link href={href} key={href}>{label}</Link>)}</div></div>
        </section>
        <section className={styles.editorialRow} aria-labelledby="work-title">
          <h2 id="work-title">Сотрудничество</h2>
          <div><p>Подбираем продукцию под ваши задачи, согласовываем объёмы и сроки. Помогаем с ассортиментом и документами на каждом этапе работы.</p></div>
        </section>
        <section className={styles.editorialRow} aria-labelledby="social-title">
          <h2 id="social-title">Социальная<br />ответственность</h2>
          <div><p>{social}</p><p>{responsibility}</p></div>
        </section>
      </div>
      <Partnership />
    </div>
  );
}

export function AboutVariants({ variant }: { variant: Exclude<AboutVariant, "original"> }) {
  return <div className={styles.experience}>{variant === "2" ? <BlueVariant /> : variant === "3" ? <MinimalVariant /> : <LightVariant />}</div>;
}
