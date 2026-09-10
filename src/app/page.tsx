import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

import { DeferredAdvantages, DeferredTestimonials } from "@/components/HomeDeferredSliders";
import { Footer } from "@/components/Footer";
import { HomeExperience } from "@/components/HomeExperience";
import { PhilosophyStat } from "@/components/PhilosophyStat";
import { Reveal } from "@/components/Reveal";
import { YandexMap } from "@/components/YandexMap";
import { ContactEmailIcon } from "@/components/icons/ContactEmailIcon";
import { ContactHoursIcon } from "@/components/icons/ContactHoursIcon";
import { ContactLocationIcon } from "@/components/icons/ContactLocationIcon";
import { ContactPhoneIcon } from "@/components/icons/ContactPhoneIcon";
import { ContactRequestForm } from "@/components/ContactRequestForm";
import { getContactProductContext } from "@/lib/contact-requests/context";
import { HomeBlog, HomeBlogPlaceholder } from "@/components/HomeBlog";
import styles from "./home.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { alternates: { canonical: "/" } };

type HomeProps = {
  searchParams: Promise<{
    product?: string | string[];
  }>;
};

const categories = [
  { name: "Мясо", image: "/assets/home/category1.jpg", href: "/catalog/meat" },
  { name: "Птица", image: "/assets/home/category2.jpg", href: "/catalog/bird" },
  { name: "Пиво", image: "/assets/home/category3.jpg", href: "/catalog/beer" },
  { name: "Вода", image: "/assets/home/category4.jpg", href: "/catalog/water" },
  { name: "Снеки", image: "/assets/home/category5.jpg", href: "#contacts" },
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

async function HomeContactForm({ searchParams }: HomeProps) {
  const { product } = await searchParams;
  const productSlug = Array.isArray(product) ? product[0] : product;
  return <ContactRequestForm product={await getContactProductContext(productSlug)} />;
}

export default function Home({ searchParams }: HomeProps) {
  return (
    <main className={styles.page} id="top">
      <HomeExperience />

      <section className={styles.catalogSection} id="catalog" aria-labelledby="catalog-title">
        <div className={styles.shell}>
          <Reveal className={styles.catalogHeading} variant="fade-up">
            <Heading eyebrow="Каталог продукции" first="Наш" accent="премиальный ассортимент" id="catalog-title" />
            <p>Только сертифицированный импорт и строгий<br />ветеринарный контроль каждой партии.</p>
          </Reveal>
          <div className={styles.categoryGrid}>
            {categories.map((category, index) => (
              <Reveal contents delay={index * 90} key={category.name} variant="fade-up">
                <a
                  className={styles.categoryCard}
                  href={category.href}
                >
                  <Image
                    className={styles.categoryImage}
                    src={category.image}
                    alt=""
                    fill
                    sizes="(max-width: 600px) 80vw, (max-width: 920px) 48vw, 25vw"
                    loading="lazy"
                  />
                  <span className={styles.categoryShade} />
                  <span className={styles.categoryLabel}>
                    {category.name}
                    <i />
                  </span>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.philosophy} id="about" aria-labelledby="philosophy-title">
        <div className={`${styles.shell} ${styles.philosophyGrid}`}>
          <Reveal variant="fade-left">
            <div>
              <p className={`${styles.eyebrow} ${styles.eyebrowDraw}`}>Наша философия</p>
              <h2 id="philosophy-title">Мы поставляем не просто продукты,<br /><span>а гастрономические решения</span></h2>
              <p className={styles.philosophyText}>
                Наша миссия — обеспечивать премиальные рестораны, бутики и ритейл-сети сырьём
                безупречного качества. Благодаря прямому импорту мы гарантируем гибкую ценовую
                политику и непрерывность поставок.
              </p>
              <Link className={styles.primaryButton} href="/news">Перейти в блог</Link>
            </div>
          </Reveal>
          <PhilosophyStat />
        </div>
      </section>

      <section className={styles.advantagesSection} id="partners" aria-labelledby="advantages-title">
        <div className={styles.shell}>
          <Reveal variant="fade-up">
            <Heading eyebrow="Почему выбирают нас" first="Преимущества для" accent="партнёров" id="advantages-title" />
          </Reveal>
          <DeferredAdvantages />
          <div className={styles.centeredCta}>
            <a className={styles.outlineButton} href="#contacts">Стать партнёром</a>
          </div>
        </div>
      </section>

      <section className={styles.testimonials} aria-labelledby="testimonials-title">
        <div className={`${styles.shell} ${styles.testimonialGrid}`}>
          <Reveal variant="fade-left">
            <h2 id="testimonials-title">Что говорят о нас<br /><span>наши клиенты</span></h2>
          </Reveal>
          <Reveal className={styles.testimonialSlider} delay={120} variant="fade-right">
            <DeferredTestimonials />
          </Reveal>
        </div>
      </section>

      <Suspense fallback={<HomeBlogPlaceholder />}>
        <HomeBlog />
      </Suspense>

      <section className={styles.contactSection} id="contacts" aria-labelledby="contacts-title">
        <div className={`${styles.shell} ${styles.contactGrid}`}>
          <Reveal variant="fade-left">
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
          </Reveal>
          <Reveal delay={140} variant="fade-right">
            <Suspense fallback={
              <div className={styles.contactForm} style={{ minHeight: 640 }} aria-busy="true">
                <h3>Заявка на партнёрство</h3>
                <p>Загружаем форму…</p>
              </div>
            }>
              <HomeContactForm searchParams={searchParams} />
            </Suspense>
          </Reveal>
        </div>
      </section>

      <section className={styles.yandexMapSection} aria-label="Карта офиса Genlix">
        <YandexMap />
      </section>

      <Footer />
    </main>
  );
}
