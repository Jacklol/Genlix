export const footerCompanyInfo = [
  "УНП 7656768768768,",
  "Юридический адрес: текст",
  "Р/с BY 000 000 000 000",
  "Банк",
] as const;

export const navItems = [
  { label: "Главная", href: "/" },
  { label: "О компании", href: "/about" },
  { label: "Каталог", href: "/#catalog" },
  { label: "Партнёры", href: "/partners" },
  { label: "Новости", href: "/news" },
  { label: "Контакты", href: "/#contacts" },
] as const;

export const footerColumns = [
  {
    title: "Каталог",
    links: [
      { label: "Мраморная говядина", href: "/#catalog" },
      { label: "Фермерская птица", href: "/#catalog" },
      { label: "Премиальные соки", href: "/#catalog" },
      { label: "Импортная вода", href: "/#catalog" },
      { label: "Деликатесы", href: "/#catalog" },
    ],
  },
  {
    title: "Компания",
    links: [
      { label: "О компании", href: "/about" },
      { label: "Стандарты качества", href: "/#about" },
      { label: "Логистика 24/7", href: "/#partners" },
      { label: "Условия оплаты", href: "/#contacts" },
      { label: "Контакты", href: "/#contacts" },
    ],
  },
  {
    title: "Контакты",
    links: [
      { label: "b2b@gildia-dist.ru", href: "mailto:b2b@gildia-dist.ru" },
      { label: "+7 (495) 123-45-67", href: "tel:+74951234567" },
      { label: "Адрес склада", href: "/#contacts" },
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
