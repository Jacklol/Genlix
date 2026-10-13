import Image from "next/image";

import { ContactRequestForm } from "@/components/ContactRequestForm";
import { ContactLocationIcon } from "@/components/icons/ContactLocationIcon";
import { contactDetails, officeLocation } from "@/lib/site-data";

import styles from "./ContactsExperience.module.css";

const topics = [
  {
    title: "Поставки и сотрудничество",
    description: "Подбор ассортимента и условия поставок для ресторанов, магазинов и дистрибьюторов.",
    link: contactDetails.phoneHref,
    value: contactDetails.phone,
  },
  {
    title: "Логистика и склад",
    description: "Вопросы по доставке, приёму и отгрузке заказов.",
    link: contactDetails.phoneHref,
    value: contactDetails.phone,
  },
  {
    title: "Документы и расчёты",
    description: "Договоры, сопроводительные документы и вопросы по взаиморасчётам.",
    link: contactDetails.emailHref,
    value: contactDetails.email,
  },
];

const mapUrl = `https://yandex.ru/maps/?ll=${officeLocation.longitude}%2C${officeLocation.latitude}&z=17&pt=${officeLocation.longitude}%2C${officeLocation.latitude}%2Cpm2blm`;
const routeUrl = `https://yandex.ru/maps/?rtext=~${officeLocation.latitude}%2C${officeLocation.longitude}&rtt=auto`;

function OfficeMap() {
  return (
    <div className={styles.map}>
      <a
        className={styles.mapPreview}
        href={mapUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={`Открыть карту — ${officeLocation.address}`}
      >
        <div className={styles.mapTiles} aria-hidden="true">
          {[0, 1, 2].flatMap((row) => [0, 1, 2].map((column) => (
            <Image
              src={`/assets/contacts/map/${row}-${column}.png`}
              width={256}
              height={256}
              alt=""
              unoptimized
              key={`${row}-${column}`}
            />
          )))}
        </div>
        <span className={styles.mapPin} aria-hidden="true"><ContactLocationIcon /></span>
        <span className={styles.mapOpen}>Открыть карту</span>
      </a>
      <a
        className={styles.mapAttribution}
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noreferrer"
      >
        © OpenStreetMap contributors
      </a>
    </div>
  );
}

export function ContactsExperience() {
  return (
    <div className={styles.experience}>
      <section className={styles.hero} aria-labelledby="contacts-title">
        <div className={styles.shell}>
          <nav className={styles.breadcrumb} aria-label="Хлебные крошки">
            <a href="/">Главная</a>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Контакты</span>
          </nav>
          <h1 id="contacts-title">Контакты</h1>

          <div className={styles.directContacts}>
            <a href={contactDetails.phoneHref}>
              <span>Телефон</span>
              <strong>{contactDetails.phone}</strong>
            </a>
            <a href={contactDetails.emailHref}>
              <span>Электронная почта</span>
              <strong>{contactDetails.email}</strong>
            </a>
          </div>

          <div className={styles.accordion}>
            {topics.map(({ title, description, link, value }) => (
              <details className={styles.topicRow} name="contact-topics" key={title}>
                <summary>
                  <h2>{title}</h2>
                  <span className={styles.plus} aria-hidden="true" />
                </summary>
                <div className={styles.rowContent}>
                  <p>{description}</p>
                  <a href={link}>{value}</a>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.locationSection} id="location" aria-labelledby="location-title">
        <div className={styles.shell}>
          <h2 className={styles.sectionHeading} id="location-title">Как нас найти</h2>
          <div className={styles.locationLayout}>
            <OfficeMap />
            <div className={styles.locationCopy}>
              <h3>Офис</h3>
              <address>{officeLocation.address}</address>
              <p className={styles.locationHours}>
                Режим работы
                <strong>{officeLocation.hours}</strong>
              </p>
              <a className={styles.routeButton} href={routeUrl} target="_blank" rel="noreferrer">
                Построить маршрут
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.requestSection} id="request" aria-labelledby="request-title">
        <div className={`${styles.shell} ${styles.requestLayout}`}>
          <div className={styles.requestCopy}>
            <h2 id="request-title">Обсудим <span>условия поставок?</span></h2>
            <p>Заполните форму, и наш категорийный менеджер подготовит коммерческое предложение под ваше меню.</p>
          </div>
          <div className={styles.requestPanel}>
            <ContactRequestForm />
          </div>
        </div>
      </section>
    </div>
  );
}
