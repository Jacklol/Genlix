import type { CSSProperties } from "react";

import { AdvantagesSlider } from "@/components/AdvantagesSlider";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { TestimonialsSlider } from "@/components/TestimonialsSlider";
import { ContactEmailIcon } from "@/components/icons/ContactEmailIcon";
import { ContactHoursIcon } from "@/components/icons/ContactHoursIcon";
import { ContactLocationIcon } from "@/components/icons/ContactLocationIcon";
import { ContactPhoneIcon } from "@/components/icons/ContactPhoneIcon";
import styles from "./home.module.css";

const categories = [
  { name: "Мясо", image: "/assets/home/category1.jpg", className: styles.categoryFeatured, href: "/catalog/meat" },
  { name: "Птица", image: "/assets/home/category2.jpg", className: "", href: "/catalog/bird" },
  { name: "Пиво", image: "/assets/home/category3.jpg", className: "", href: "/catalog/beer" },
  { name: "Вода", image: "/assets/home/category4.jpg", className: "", href: "#contacts" },
  { name: "Снеки", image: "/assets/home/category5.jpg", className: "", href: "#contacts" },
] as const;

const news = [
  {
    title: "Новый отруб Primebeef для стейк-хаусов",
    tag: "Поставки и качество",
    image: "/assets/home/news_item1.jpg",
  },
  {
    title: "Контроль качества на каждом этапе поставки",
    tag: "Поставки и качество",
    image: "/assets/home/news_item2.jpg",
  },
  {
    title: "Новая линейка премиальных напитков",
    tag: "Новая линейка",
    image: "/assets/home/news_item3.jpg",
  },
  {
    title: "Расширяем ассортимент для ресторанных групп",
    tag: "Поставки и качество",
    image: "/assets/home/news_item4.jpg",
  },
] as const;

function Heading({
  eyebrow,
  first,
  accent,
  id,
}: {
  eyebrow: string;
  first: string;
  accent: string;
  id?: string;
}) {
  return (
    <div className={styles.headingBlock}>
      <p>{eyebrow}</p>
      <h2 id={id}>
        {first} <span>{accent}</span>
      </h2>
    </div>
  );
}

export default function Home() {
  return (
    <main className={styles.page} id="top">
      <Header />

      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroGlow} aria-hidden="true" />
        <div className={styles.shell}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Эксклюзивный дистрибьютор для HoReCa &amp; Retail</p>
            <h1 id="hero-title">Premium-мясо и напитки<br />для профессионалов</h1>
            <p className={styles.heroLead}>
              Прямые импортные поставки. Сертифицированное качество.<br />
              Работаем с HoReCa и Ритейлом.
            </p>
            <div className={styles.heroActions}>
              <a className={styles.primaryButton} href="#contacts">Стать партнёром</a>
              <a className={styles.secondaryButton} href="#catalog">Перейти в каталог</a>
            </div>
          </div>
        </div>
        <div className={styles.scrollCue} aria-hidden="true"><span /></div>
      </section>

      <section className={styles.catalogSection} id="catalog" aria-labelledby="catalog-title">
        <div className={styles.shell}>
          <div className={styles.catalogHeading}>
            <Heading eyebrow="Каталог продукции" first="Наш" accent="премиальный ассортимент" id="catalog-title" />
            <p>Только сертифицированный импорт и строгий<br />ветеринарный контроль каждой партии.</p>
          </div>
          <div className={styles.categoryGrid}>
            {categories.map((category) => (
              <a
                className={`${styles.categoryCard} ${category.className}`}
                href={category.href}
                key={category.name}
                style={{ "--category-image": `url("${category.image}")` } as CSSProperties}
              >
                <span className={styles.categoryShade} />
                <span className={styles.categoryLabel}>{category.name}<i /></span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.philosophy} id="about" aria-labelledby="philosophy-title">
        <div className={`${styles.shell} ${styles.philosophyGrid}`}>
          <div>
            <p className={styles.eyebrow}>Наша философия</p>
            <h2 id="philosophy-title">Мы поставляем не просто продукты,<br /><span>а гастрономические решения</span></h2>
            <p className={styles.philosophyText}>
              Наша миссия — обеспечивать премиальные рестораны, бутики и ритейл-сети сырьём
              безупречного качества. Благодаря прямому импорту мы гарантируем гибкую ценовую
              политику и непрерывность поставок.
            </p>
            <a className={styles.primaryButton} href="/news">Все новости</a>
          </div>
          <div className={styles.statCard}>
            <span>01</span>
            <strong>12 лет</strong>
            <p>на рынке</p>
          </div>
        </div>
      </section>

      <section className={styles.advantagesSection} id="partners" aria-labelledby="advantages-title">
        <div className={styles.shell}>
          <Heading eyebrow="Почему выбирают нас" first="Преимущества для" accent="партнёров" id="advantages-title" />
          <AdvantagesSlider />
          <div className={styles.centeredCta}>
            <a className={styles.outlineButton} href="#contacts">Стать партнёром</a>
          </div>
        </div>
      </section>

      <section className={styles.testimonials} aria-labelledby="testimonials-title">
        <div className={`${styles.shell} ${styles.testimonialGrid}`}>
          <h2 id="testimonials-title">Что говорят о нас<br /><span>наши клиенты</span></h2>
          <TestimonialsSlider />
        </div>
      </section>

      <section className={styles.newsSection} id="news" aria-labelledby="news-title">
        <div className={styles.shell}>
          <div className={styles.newsHeading}>
            <Heading eyebrow="Новости & статьи" first="События индустрии" accent="и новости компании" id="news-title" />
            <a className={styles.outlineButton} href="/news">Все новости</a>
          </div>
          <div className={styles.newsGrid} id="news-grid">
            {news.map((item, index) => (
              <article
                className={styles.newsCard}
                key={`${item.title}-${index}`}
                style={{ "--news-image": `url("${item.image}")` } as CSSProperties}
              >
                <span className={styles.newsShade} />
                <div>
                  <span>{item.tag}</span>
                  <h3>{item.title}</h3>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.contactSection} id="contacts" aria-labelledby="contacts-title">
        <div className={`${styles.shell} ${styles.contactGrid}`}>
          <div className={styles.contactCopy}>
            <p className={styles.eyebrow}>Связаться с нами</p>
            <h2 id="contacts-title">Обсудим <span>условия поставок?</span></h2>
            <p>Заполните форму, и наш категорийный менеджер подготовит коммерческое предложение под ваше меню.</p>
            <address>
              <a href="tel:+74951234567">
                <i aria-hidden="true">
                  <ContactPhoneIcon />
                </i>
                <span>
                  <small>Телефон для связи</small>
                  <strong>+7 (495) 123-45-67</strong>
                </span>
              </a>
              <a href="mailto:b2b@gildia-dist.ru">
                <i aria-hidden="true">
                  <ContactEmailIcon />
                </i>
                <span>
                  <small>Email подразделения продаж</small>
                  <strong>b2b@gildia-dist.ru</strong>
                </span>
              </a>
              <span>
                <i aria-hidden="true">
                  <ContactLocationIcon />
                </i>
                <span>
                  <small>Центральный офис и склад</small>
                  <strong>г. Москва, ул. Кутузовский проспект, д. 12, стр. 4</strong>
                </span>
              </span>
              <span>
                <i aria-hidden="true">
                  <ContactHoursIcon />
                </i>
                <span>
                  <small>Режим работы склада</small>
                  <strong>Круглосуточный приём и отгрузка заказов 24/7</strong>
                </span>
              </span>
            </address>
          </div>
          <form className={styles.contactForm}>
            <h3>Заявка на партнёрство</h3>
            <label>Название компании<input name="company" placeholder="ООО Гастрономия Плюс" /></label>
            <label>Ваше имя<input name="name" placeholder="Владислав Козлов" /></label>
            <label>Контактный телефон<input name="phone" placeholder="+7 (999) 123-45-67" inputMode="tel" /></label>
            <label>Электронная почта<input name="email" placeholder="name@company.ru" type="email" /></label>
            <fieldset>
              <legend>Тип бизнеса</legend>
              <label><input defaultChecked name="business" type="radio" /> HoReCa</label>
              <label><input name="business" type="radio" /> Ритейл</label>
              <label><input name="business" type="radio" /> Дистрибьютор</label>
            </fieldset>
            <button className={styles.primaryButton} type="submit">Отправить заявку</button>
            <label className={styles.consent}><input defaultChecked type="checkbox" /> Нажимая кнопку, вы соглашаетесь с условиями обработки персональных данных.</label>
          </form>
        </div>
      </section>

      <Footer />
    </main>
  );
}
