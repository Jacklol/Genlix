import type { CSSProperties } from "react";

import styles from "./home.module.css";

const navItems = [
  ["Главная", "#top"],
  ["О компании", "#about"],
  ["Каталог", "#catalog"],
  ["Партнёры", "#partners"],
  ["Новости", "#news"],
  ["Контакты", "#contacts"],
] as const;

const categories = [
  { name: "Мясо", position: "0%", className: styles.categoryFeatured },
  { name: "Птица", position: "25%", className: "" },
  { name: "Пиво", position: "50%", className: "" },
  { name: "Вода", position: "75%", className: "" },
  { name: "Снеки", position: "100%", className: "" },
] as const;

const advantages = [
  {
    index: "01",
    icon: "▦",
    title: "Собственная логистика",
    text: "Рефрижераторы и точные температурные режимы на всём маршруте.",
  },
  {
    index: "02",
    icon: "▤",
    title: "Индивидуальные условия",
    text: "Гибкие лимиты, графики поставок и цены под объём вашего бизнеса.",
  },
  {
    index: "03",
    icon: "▱",
    title: "Полный пакет документов",
    text: "Сертификация, ветеринарные и таможенные документы к каждой партии.",
  },
  {
    index: "04",
    icon: "◉",
    title: "Личный менеджер",
    text: "Один контакт для заказов, остатков, срочных задач и консультаций.",
  },
  {
    index: "05",
    icon: "◎",
    title: "Стабильное качество",
    text: "Одинаковая калибровка и органолептика от поставки к поставке.",
  },
] as const;

const news = [
  { title: "Новый отруб Primebeef для стейк-хаусов", position: "0%" },
  { title: "Контроль качества на каждом этапе поставки", position: "25%" },
  { title: "Новая линейка премиальных напитков", position: "75%" },
  { title: "Расширяем ассортимент для ресторанных групп", position: "50%" },
] as const;

const footerColumns = [
  {
    title: "Каталог",
    links: ["Мраморная говядина", "Фермерская птица", "Премиальные соки", "Импортная вода", "Деликатесы"],
  },
  {
    title: "Компания",
    links: ["О компании", "Стандарты качества", "Логистика 24/7", "Условия оплаты", "Контакты"],
  },
  {
    title: "Связь",
    links: ["b2b@gildia-dist.ru", "+7 (495) 123-45-67", "Адрес склада", "Заявка на прайс", "Telegram-канал"],
  },
] as const;

function Brand() {
  return (
    <a className={styles.brand} href="#top" aria-label="Genlix — на главную">
      <span aria-hidden="true" />
      <strong>Genlix</strong>
    </a>
  );
}

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
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Brand />
          <nav className={styles.desktopNav} aria-label="Основная навигация">
            {navItems.map(([label, href], index) => (
              <a className={index === 0 ? styles.activeLink : undefined} href={href} key={label}>
                {label}
              </a>
            ))}
          </nav>
          <div className={styles.headerActions}>
            <a className={styles.phone} href="tel:+74951234567">+7 (495) 123-45-67</a>
            <a className={styles.primaryButton} href="#contacts">Стать партнёром</a>
          </div>
          <details className={styles.mobileMenu}>
            <summary aria-label="Открыть меню"><span /><span /><span /></summary>
            <nav aria-label="Мобильная навигация">
              {navItems.map(([label, href]) => <a href={href} key={label}>{label}</a>)}
              <a href="tel:+74951234567">+7 (495) 123-45-67</a>
            </nav>
          </details>
        </div>
      </header>

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
                className={`${styles.categoryCard} ${category.className ?? ""}`}
                href="#contacts"
                key={category.name}
                style={{ "--image-position": category.position } as CSSProperties}
              >
                <span className={styles.categoryShade} />
                <span className={styles.categoryLabel}>{category.name}<i /></span>
              </a>
            ))}
          </div>
          <div className={styles.catalogCta}>
            <a className={styles.primaryButton} href="#contacts">Перейти в каталог</a>
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
            <a className={styles.primaryButton} href="#news">Все новости</a>
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
          <div className={styles.advantagesGrid}>
            {advantages.map((item) => (
              <article className={styles.advantage} key={item.title}>
                <span className={styles.advantageIndex}>{item.index}</span>
                <span className={styles.advantageIcon} aria-hidden="true">{item.icon}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
          <div className={styles.centeredCta}>
            <a className={styles.outlineButton} href="#contacts">Стать партнёром</a>
          </div>
        </div>
      </section>

      <section className={styles.testimonials} aria-labelledby="testimonials-title">
        <div className={`${styles.shell} ${styles.testimonialGrid}`}>
          <h2 id="testimonials-title">Что говорят о нас<br /><span>наши клиенты</span></h2>
          <blockquote>
            <div className={styles.quoteRule} />
            <h3>Стабильность, <span>которой можно доверять</span></h3>
            <p>
              «Сотрудничаем по пивной и водной картам уже более четырёх лет. Для нас, как
              управляющих холдингом, критически важна бесперебойность. Гильдия ни разу не
              сорвала поставку даже в праздничные дни».
            </p>
            <footer>
              <span className={styles.avatar}>ЕМ</span>
              <span><strong>Екатерина Миронова</strong><small>Управляющая HoReCa Group</small></span>
            </footer>
            <div className={styles.quoteControls} aria-hidden="true"><i>←</i><i>→</i></div>
          </blockquote>
        </div>
      </section>

      <section className={styles.newsSection} id="news" aria-labelledby="news-title">
        <div className={styles.shell}>
          <div className={styles.newsHeading}>
            <Heading eyebrow="Новости & статьи" first="События индустрии" accent="и новости компании" id="news-title" />
            <a className={styles.outlineButton} href="#news-grid">Все новости</a>
          </div>
          <div className={styles.newsGrid} id="news-grid">
            {news.map((item, index) => (
              <article
                className={`${styles.newsCard} ${index === 0 || index === 3 ? styles.newsWide : ""}`}
                key={`${item.title}-${index}`}
                style={{ "--image-position": item.position } as CSSProperties}
              >
                <span className={styles.newsShade} />
                <div><span>{index === 2 ? "Новая линейка" : "Поставки и качество"}</span><h3>{item.title}</h3></div>
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
              <a href="tel:+74951234567"><i>☎</i><span><small>Телефон для связи</small><strong>+7 (495) 123-45-67</strong></span></a>
              <a href="mailto:b2b@gildia-dist.ru"><i>✉</i><span><small>Email подразделения продаж</small><strong>b2b@gildia-dist.ru</strong></span></a>
              <span><i>⌖</i><span><small>Центральный офис и склад</small><strong>г. Москва, ул. Кутузовский проспект, д. 12, стр. 4</strong></span></span>
              <span><i>◷</i><span><small>Режим работы склада</small><strong>Круглосуточный приём и отгрузка заказов 24/7</strong></span></span>
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

      <footer className={styles.footer}>
        <div className={`${styles.shell} ${styles.footerGrid}`}>
          <div className={styles.footerAbout}>
            <Brand />
            <p>Импорт и комплексная дистрибуция мяса и премиальных напитков для ресторанных холдингов и элитного ритейла.</p>
          </div>
          {footerColumns.map((column) => (
            <div className={styles.footerColumn} key={column.title}>
              <h3>{column.title}</h3>
              {column.links.map((link) => <a href="#contacts" key={link}>{link}</a>)}
            </div>
          ))}
        </div>
        <div className={`${styles.shell} ${styles.footerBottom}`}>
          <span>© 2026 ООО «Гильдия Дистрибуция». Все права защищены.</span>
          <div aria-label="Социальные сети"><a href="#contacts">in</a><a href="#contacts">tg</a><a href="#contacts">vk</a></div>
        </div>
      </footer>
    </main>
  );
}
