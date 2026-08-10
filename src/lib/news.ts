export type NewsContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] };

export type NewsArticle = {
  slug: string;
  tag: string;
  date: string;
  dateTime: string;
  title: string;
  description: string;
  image: string;
  href: string;
  content: NewsContentBlock[];
};

const defaultContent = (topic: string): NewsContentBlock[] => [
  {
    type: "paragraph",
    text: `${topic} — задача, с которой к нам обращаются рестораны, мясные бутики и региональные сети. Ниже — практические шаги, которые помогают выстроить стабильный процесс без срывов поставок.`,
  },
  {
    type: "heading",
    text: "С чего начать",
  },
  {
    type: "paragraph",
    text: "Первый этап — согласование ассортиментной матрицы и фасовки под формат кухни или витрины. Мы фиксируем отрубы, калибровку, температурный режим и график отгрузок в коммерческом предложении, чтобы команда могла планировать закупки заранее.",
  },
  {
    type: "list",
    items: [
      "Подбор позиций под меню или полочное пространство",
      "Согласование объёмов и графика поставок",
      "Проверка документов и сертификатов на каждую партию",
      "Назначение персонального менеджера",
    ],
  },
  {
    type: "heading",
    text: "Что получает партнёр",
  },
  {
    type: "paragraph",
    text: "Genlix берёт на себя логистику, контроль качества и сопровождение документов. Это снижает нагрузку на закупки и позволяет сосредоточиться на сервисе и продажах. При необходимости подключаем дегустации, обучение персонала и помощь в запуске новых позиций.",
  },
  {
    type: "paragraph",
    text: "Если вы планируете обновить ассортимент или ищете надёжного поставщика для HoReCa и ритейла — оставьте заявку, и мы подготовим предложение под ваш формат.",
  },
];

export const newsArticles: NewsArticle[] = [
  {
    slug: "stable-supplies-restaurant-menu",
    tag: "Главный материал",
    date: "18 июля 2026",
    dateTime: "2026-07-18",
    title: "Как стабильные поставки помогли ресторану обновить мясное меню",
    description:
      "Разбираем основные этапы: подбор ассортимента, согласование фасовки, планирование графика и контроль качества.",
    image: "/assets/home/news_item3.jpg",
    href: "/news/stable-supplies-restaurant-menu",
    content: defaultContent("Обновление мясного меню"),
  },
  {
    slug: "new-deliveries-steaks",
    tag: "Новые поставки",
    date: "12 июля 2026",
    dateTime: "2026-07-12",
    title: "Новая линейка стейков Primebeef для стейк-хаусов",
    description:
      "Расширили поставки премиальных отрубов с предсказуемой калибровкой и стабильной марbling для профессиональных кухонь.",
    image: "/assets/home/category1.jpg",
    href: "/news/new-deliveries-steaks",
    content: defaultContent("Запуск линейки стейков"),
  },
  {
    slug: "choose-cut-cooking",
    tag: "Выбор и приготовление",
    date: "5 июля 2026",
    dateTime: "2026-07-05",
    title: "Как выбрать отруб для разных способов приготовления",
    description:
      "Краткий гид по отрубам: что подходит для гриля, тушения и медленного приготовления в ресторане.",
    image: "/assets/home/news_item1.jpg",
    href: "/news/choose-cut-cooking",
    content: defaultContent("Выбор отруба"),
  },
  {
    slug: "farm-quality-control",
    tag: "Фермы-поставщики",
    date: "28 июня 2026",
    dateTime: "2026-06-28",
    title: "Как устроен контроль качества на ферме-поставщике",
    description:
      "Рассказываем, какие этапы проверки проходит продукция до попадания на склад Genlix.",
    image: "/assets/home/category2.jpg",
    href: "/news/farm-quality-control",
    content: defaultContent("Контроль качества на ферме"),
  },
  {
    slug: "meat-shop-assortment",
    tag: "Кейс сотрудничества",
    date: "20 июня 2026",
    dateTime: "2026-06-20",
    title: "Ассортиментная матрица для новой мясной лавки",
    description:
      "Как мы помогли сети мясных бутиков собрать матрицу из 40 SKU и выйти на стабильные еженедельные поставки.",
    image: "/assets/home/news_item2.jpg",
    href: "/news/meat-shop-assortment",
    content: defaultContent("Матрица для мясной лавки"),
  },
  {
    slug: "dry-aging-guide",
    tag: "Выбор и приготовление",
    date: "14 июня 2026",
    dateTime: "2026-06-14",
    title: "Сухое вызревание: что важно знать профессионалу",
    description:
      "Температура, влажность, сроки и органолептика — ключевые параметры для ресторанов с dry-age программой.",
    image: "/assets/home/news_item4.jpg",
    href: "/news/dry-aging-guide",
    content: defaultContent("Сухое вызревание"),
  },
];

export const featuredNewsArticle = newsArticles[0];

export function getNewsArticleBySlug(slug: string) {
  return newsArticles.find((article) => article.slug === slug);
}

export function getAllNewsSlugs() {
  return newsArticles.map((article) => article.slug);
}

export function getRelatedNewsArticles(slug: string, limit = 3) {
  return newsArticles.filter((article) => article.slug !== slug).slice(0, limit);
}
