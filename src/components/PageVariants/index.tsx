import Image from "next/image";
import Link from "next/link";

import { ContactRequestForm } from "@/components/ContactRequestForm";
import { ContactRequestModal } from "@/components/ContactRequestModal";
import { ContactLocationIcon } from "@/components/icons/ContactLocationIcon";
import { catalogSections, contactDetails, footerCompanyInfo, officeLocation } from "@/lib/site-data";

import { photography, type AboutBlock, type Concept, type ContactBlock, type Detail, type Focus, type Media } from "./model";
import { Topics } from "./Topics";
import styles from "./PageVariants.module.css";

const routeUrl = `https://yandex.ru/maps/?rtext=~${officeLocation.latitude}%2C${officeLocation.longitude}&rtt=auto`;

const contactTopics: readonly Detail[] = [
  ["Подбор ассортимента", "Сообщите категорию, город и ориентир по объёму. Это поможет начать разговор об условиях поставки."],
  ["Действующий заказ", "Подготовьте номер заказа или название организации. Уточним вопрос по отгрузке или доставке."],
  ["Документы и расчёты", "Укажите компанию и напишите, какой договор, накладную или другой документ нужно уточнить."],
];

const audiences: readonly Detail[] = [
  ["Рестораны", "Отрубы и другие позиции для вашего меню. При подборе учитываем назначение продукта и формат порции."],
  ["Гостиницы", "Продукция для завтраков, ресторанов и банкетов. Обсудим объём и сроки под ваш формат."],
  ["Розничные сети", "Ассортимент и фасовка для магазина. Согласуем категории и условия приёмки."],
];

function Photo({ media, prominent = false }: { media: Media; prominent?: boolean }) {
  const [src, alt] = photography[media];
  return (
    <figure className={styles.photo}>
      <Image src={src} alt={alt} fill sizes="(max-width: 740px) 100vw, (max-width: 1150px) 75vw, 1200px" loading={prominent ? "eager" : "lazy"} />
      {["office", "kitchen", "logistics", "table", "community"].includes(media) && (
        <figcaption className={styles.photoNote}>Иллюстрация</figcaption>
      )}
    </figure>
  );
}

function RequestButton({ label = "Запросить предложение" }: { label?: string }) {
  return <ContactRequestModal className={styles.button} label={label} />;
}

function RouteLink() {
  return <a className={styles.button} href={routeUrl} target="_blank" rel="noreferrer">Построить маршрут</a>;
}

function Primary({ focus, scene }: { focus: Focus; scene: Concept<string>["scene"] }) {
  switch (focus) {
    case "phone": return <a className={styles.button} href={contactDetails.phoneHref}>Позвонить в Genlix</a>;
    case "email": return <a className={styles.button} href={contactDetails.emailHref}>Написать письмо</a>;
    case "route": return <RouteLink />;
    case "catalog": return <Link className={styles.button} href="/#catalog">Смотреть каталог</Link>;
    case "social": return <a className={styles.button} href="#social">О социальной работе</a>;
    case "work": return <a className={styles.button} href="#more">Подробнее о компании</a>;
    case "request": return scene === "form" ? <a className={styles.button} href="#request">Перейти к заявке</a> : <RequestButton />;
  }
}

function Details({ items, numbered = false }: { items: readonly Detail[]; numbered?: boolean }) {
  if (items.length === 0) return null;
  const List = numbered ? "ol" : "ul";
  return (
    <List className={styles.details}>
      {items.map(([title, text]) => <li key={title}><strong>{title}</strong><p>{text}</p></li>)}
    </List>
  );
}

function Address() {
  return <div className={styles.address}><address>{officeLocation.address}</address><p>{officeLocation.hours}</p></div>;
}

function Map() {
  return (
    <div className={styles.map}>
      <a className={styles.mapLink} href={routeUrl} target="_blank" rel="noreferrer" aria-label="Построить маршрут до офиса Genlix">
        <div className={styles.tiles} aria-hidden="true">
          {[0, 1, 2].flatMap((row) => [0, 1, 2].map((column) => (
            <Image key={`${row}-${column}`} src={`/assets/contacts/map/${row}-${column}.png`} alt="" width={256} height={256} unoptimized />
          )))}
        </div>
        <span className={styles.pin} aria-hidden="true"><ContactLocationIcon /></span>
      </a>
      <a className={styles.attribution} href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a>
    </div>
  );
}

function Channels() {
  return (
    <div className={styles.channels}>
      <a href={contactDetails.phoneHref}><span>Телефон</span><strong>{contactDetails.phone}</strong></a>
      <a href={contactDetails.emailHref}><span>Почта</span><strong>{contactDetails.email}</strong></a>
      <a href={routeUrl} target="_blank" rel="noreferrer"><span>Офис в Минске</span><strong>ул. Могилёвская, 43А</strong></a>
    </div>
  );
}

function ContactSection({ block }: { block: ContactBlock }) {
  switch (block) {
    case "direct": return <section className={styles.band}><h2>Связаться с нами</h2><Channels /></section>;
    case "visit": return <section className={styles.band} id="location"><div className={styles.visit}><div><h2>Как нас найти</h2><Address /><RouteLink /></div><Map /></div></section>;
    case "topics": return (
      <section className={styles.band}>
        <h2>По какому вопросу?</h2>
        <div className={styles.accordion}>
          {contactTopics.map(([title, text]) => <details key={title} name="contact-topic"><summary>{title}</summary><p>{text}</p></details>)}
        </div>
      </section>
    );
    case "request": return (
      <section id="request" className={`${styles.band} ${styles.callout}`}>
        <div><h2>Обсудим поставку</h2><p>Оставьте контакты, чтобы мы могли связаться с вами по вашему запросу.</p></div>
        <RequestButton label="Оставить заявку" />
      </section>
    );
    case "legal": return (
      <section className={styles.band}><h2>Реквизиты</h2>{footerCompanyInfo.map((line) => <p key={line}>{line}</p>)}</section>
    );
    case "cities": return (
      <section className={styles.band} id="request"><h2>Параметры поставки</h2><Details items={[
        ["Город и адрес", "Укажите город, точки приёмки или адрес склада."],
        ["Продукты и количество", "Подойдёт список позиций или описание ваших задач."],
        ["Сроки", "Запишите, когда нужна поставка и какой график вы рассматриваете."],
      ]} /><div className={styles.sectionAction}><RequestButton /></div></section>
    );
  }
}

function Range() {
  const media = ["meat", "chicken", "drinks", "water"] as const;
  return (
    <div className={styles.range}>
      {catalogSections.map(({ label, href }, i) => (
        <Link key={href} href={href} prefetch={false}><Photo media={media[i]} /><span>{label}</span></Link>
      ))}
    </div>
  );
}

function AboutSection({ block }: { block: AboutBlock }) {
  switch (block) {
    case "story": return (
      <section className={styles.band}><div className={styles.story}><strong>2012</strong><div><h2>С чего началась работа</h2><p>Genlix работает на рынке с 2012 года. Сегодня компания поставляет продукты питания для ресторанов, гостиниц и розничных сетей в Беларуси.</p></div></div></section>
    );
    case "range": return <section className={styles.band}><h2>Ассортимент</h2><Range /></section>;
    case "care": return (
      <section className={`${styles.band} ${styles.care}`} id="social"><div><h2>Социальная ответственность</h2><p>Genlix участвует в социальных проектах. Компания помогает детским домам, пенсионерам и ветеранам Великой Отечественной войны.</p></div><Photo media="community" /></section>
    );
    case "workflow": return (
      <section className={styles.band}><h2>От запроса до отгрузки</h2><Details numbered items={[
        ["Знакомимся", "Обсуждаем, что нужно вашему бизнесу."],
        ["Подбираем", "Сверяем категории, позиции и упаковку."],
        ["Согласовываем", "Уточняем объём, документы и условия доставки."],
      ]} /></section>
    );
    case "audience": return <section className={styles.band}><h2>Кому поставляем</h2><Details items={audiences} /></section>;
    case "quality": return (
      <section className={styles.band}><div className={styles.care}><Photo media="control" /><div><h2>Контроль продукции</h2><p>При подборе учитываем характеристики продукта и условия хранения. Требования к сопроводительным документам можно обсудить до оформления заказа.</p></div></div></section>
    );
  }
}

export function PageVariant({ page, look }: { page: "contacts"; look: Concept<ContactBlock> } | { page: "about"; look: Concept<AboutBlock> }) {
  const concept: Concept<string> = look;
  const { scene } = concept;
  const contact = page === "contacts";
  const heroDetails = scene === "ledger" || scene === "steps";
  const hasRequest = scene === "form" || (contact && (look.sections.includes("request") || look.sections.includes("cities")));
  const hasDirect = contact && look.sections.includes("direct");

  return (
    <div className={styles.experience} data-scene={scene} data-palette={look.palette} data-effect={look.effect}>
      <section className={styles.hero} aria-labelledby="concept-title">
        <div className={styles.frame}>
          <div className={styles.copy}>
            <p className={styles.eyebrow}>{contact ? "Контакты" : "О компании"}</p>
            <h1 id="concept-title">{look.title}</h1>
            <p className={styles.lead}>{look.lead}</p>
            <div className={styles.actions}>
              <Primary focus={look.focus} scene={scene} />
              {scene !== "map" && (contact ? (
                <a className={styles.secondary} href="#location">Адрес и часы работы</a>
              ) : (
                <Link className={styles.secondary} href="/contacts">Контакты</Link>
              ))}
            </div>
            {contact && (scene === "poster" || scene === "inbox") && (
              <a className={styles.displayContact} href={scene === "poster" ? contactDetails.phoneHref : contactDetails.emailHref}>
                {scene === "poster" ? contactDetails.phone : contactDetails.email}
              </a>
            )}
            {scene === "map" && <div id="location"><Address /></div>}
          </div>
          {scene === "map" && <div className={styles.visual}><Map /></div>}
          {scene === "tabs" && <div className={styles.visual}><Topics items={contact ? contactTopics : audiences} /></div>}
          {scene === "form" && <div className={styles.form} id="request"><ContactRequestForm /></div>}
          {concept.image && (
            <div className={styles.visual}>
              <Photo media={concept.image} prominent />
              {concept.second && <Photo media={concept.second} prominent={scene === "diptych"} />}
            </div>
          )}
          {heroDetails && <div className={styles.heroDetails}><Details items={look.details} numbered={scene === "steps"} /></div>}
          {scene === "ticker" && <div className={styles.ticker}>{catalogSections.map(({ label, href }) => <Link key={href} href={href}>{label}</Link>)}</div>}
        </div>
      </section>

      <div className={styles.body} id="more">
        {!heroDetails && look.details.length > 0 && <div className={styles.band}><Details items={look.details} /></div>}
        {contact ? look.sections.map((block) => <ContactSection key={block} block={block} />) : look.sections.map((block) => <AboutSection key={block} block={block} />)}
        {contact && !hasDirect && <section className={styles.band}><h2>Контакты Genlix</h2><Channels /></section>}
        {contact && !hasRequest && <ContactSection block="request" />}
        {!contact && scene !== "form" && <div className={`${styles.band} ${styles.callout}`}><h2>Стать партнёром Genlix</h2><RequestButton label="Обсудить сотрудничество" /></div>}
      </div>
    </div>
  );
}
