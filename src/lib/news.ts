export type NewsArticle = {
  slug: string;
  tag: string;
  date: string;
  title: string;
  description: string;
  image: string;
  href: string;
};

export const newsArticles: NewsArticle[] = [
  {
    slug: "stable-supplies-restaurant-menu",
    tag: "Главный материал",
    date: "18 июля 2026",
    title: "Как стабильные поставки помогли ресторану обновить мясное меню",
    description:
      "Разбираем основные этапы: подбор ассортимента, согласование фасовки, планирование графика и контроль качества.",
    image: "/assets/home/news_item3.jpg",
    href: "#",
  },
  {
    slug: "new-deliveries-steaks",
    tag: "Новые поставки",
    date: "18 июля 2026",
    title: "Как стабильные поставки помогли ресторану обновить мясное меню",
    description:
      "Разбираем основные этапы: подбор ассортимента, согласование фасовки, планирование графика и контроль качества.",
    image: "/assets/home/category1.jpg",
    href: "#",
  },
  {
    slug: "choose-cut-cooking",
    tag: "Выбор и приготовление",
    date: "18 июля 2026",
    title: "Как выбрать отруб для разных способов приготовления",
    description:
      "Разбираем основные этапы: подбор ассортимента, согласование фасовки, планирование графика и контроль качества.",
    image: "/assets/home/news_item1.jpg",
    href: "#",
  },
  {
    slug: "farm-quality-control",
    tag: "Фермы-поставщики",
    date: "18 июля 2026",
    title: "Как устроен контроль качества на ферме-поставщике",
    description:
      "Разбираем основные этапы: подбор ассортимента, согласование фасовки, планирование графика и контроль качества.",
    image: "/assets/home/category2.jpg",
    href: "#",
  },
  {
    slug: "meat-shop-assortment",
    tag: "Кейс сотрудничества",
    date: "18 июля 2026",
    title: "Ассортиментная матрица для новой мясной лавки",
    description:
      "Разбираем основные этапы: подбор ассортимента, согласование фасовки, планирование графика и контроль качества.",
    image: "/assets/home/news_item2.jpg",
    href: "#",
  },
  {
    slug: "dry-aging-guide",
    tag: "Выбор и приготовление",
    date: "18 июля 2026",
    title: "Сухое вызревание: что важно знать профессионалу",
    description:
      "Разбираем основные этапы: подбор ассортимента, согласование фасовки, планирование графика и контроль качества.",
    image: "/assets/home/news_item4.jpg",
    href: "#",
  },
];
