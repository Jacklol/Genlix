// Legal address: https://food-store.by/contacts/ and
// https://contragento.by/company/191772353 (checked 2026-10-12).
export const footerCompanyInfo = [
  "ООО «Генликс», УНП 191772353",
  "Юридический адрес: 223056, Республика Беларусь, Минская область, Минский район, Сеницкий с/с, район д. Щитомиричи, д. 27, корп. 4, пом. 141",
] as const;

// Office and contacts: https://genlix.by/contacts/ (checked 2026-10-12).
export const officeLocation = {
  latitude: 53.886594,
  longitude: 27.560825,
  address: "Республика Беларусь, г. Минск, ул. Могилёвская, 43А, 2-й этаж",
  hours: "Пн–Пт · 9:00–17:00",
} as const;

export const contactDetails = {
  phone: "+375 (29) 659-52-92",
  phoneHref: "tel:+375296595292",
  email: "genlix@yandex.by",
  emailHref: "mailto:genlix@yandex.by",
} as const;

export const catalogSections = [
  { label: "Мясо", href: "/catalog/meat" },
  { label: "Птица", href: "/catalog/bird" },
  { label: "Пиво", href: "/catalog/beer" },
  { label: "Вода", href: "/catalog/water" },
] as const;

export const navItems = [
  { label: "Главная", href: "/" },
  { label: "О компании", href: "/about" },
  { label: "Каталог", href: "/#catalog" },
  { label: "Партнёры", href: "/partners" },
  { label: "Блог", href: "/news" },
  { label: "Контакты", href: "/contacts" },
] as const;

export const footerColumns = [
  {
    title: "Каталог",
    links: catalogSections,
  },
  {
    title: "Компания",
    links: [
      { label: "О компании", href: "/about" },
      { label: "Стандарты качества", href: "/#about" },
      { label: "Логистика 24/7", href: "/#partners" },
      { label: "Условия оплаты", href: "/#contacts" },
      { label: "Контакты", href: "/contacts" },
    ],
  },
  {
    title: "Контакты",
    links: [
      { label: contactDetails.email, href: contactDetails.emailHref },
      { label: contactDetails.phone, href: contactDetails.phoneHref },
      { label: "Адрес офиса", href: "/contacts#location" },
      { label: "Заявка на прайс", href: "/#contacts" },
      { label: "Telegram-канал", href: "/#contacts" },
    ],
  },
] as const;

export const testimonials = [
  {
    title: "Стабильность,",
    titleAccent: "которой можно доверять",
    quote:
      "«Сотрудничаем по пивной и водной картам уже более четырёх лет. Для нас, как управляющих холдингом, критически важна бесперебойность. Гильдия ни разу не сорвала поставку даже в праздничные дни».",
    initials: "ЕМ",
    name: "Екатерина Миронова",
    role: "Управляющая HoReCa Group",
  },
  {
    title: "Качество,",
    titleAccent: "которое чувствуется в меню",
    quote:
      "«Перешли на мраморную говядину Genlix для всей сети стейк-хаусов. Калибровка стабильная, отрубы всегда соответствуют заявленным характеристикам. Гости заметили разницу уже в первый месяц».",
    initials: "АК",
    name: "Андрей Ковалёв",
    role: "Шеф-повар ресторанной группы",
  },
  {
    title: "Партнёрство,",
    titleAccent: "без лишней бюрократии",
    quote:
      "«Для ритейла важны сроки и документы. С Genlix получаем полный пакет сертификатов к каждой партии, а менеджер всегда на связи. Запуск новых SKU проходит без задержек».",
    initials: "МС",
    name: "Марина Соколова",
    role: "Категорийный директор сети",
  },
] as const;
