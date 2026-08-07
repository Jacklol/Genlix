import type { BreadcrumbItem } from "@/components/Breadcrumbs";
import type { ProductCardData } from "@/components/ProductCard";

export type ProductDetailData = {
  slug: string;
  breadcrumbs: BreadcrumbItem[];
  images: string[];
  brand: string;
  category: string;
  title: string;
  packaging: string;
  description: string;
  shelfLife: string;
  storage: string;
  cookingMethods: string[];
  beerRecommendationLabel?: string;
  buttonLabel?: string;
  buttonHref?: string;
};

const sharedMeatSpecs = [
  { label: "Фасовка", value: "блок 5+ кг / вакуум 0,8 кг" },
  { label: "Мраморность", value: "5" },
  { label: "Вызревание", value: "сухое вызревание 28 дней" },
  { label: "Хранение", value: "0...+4°C" },
] as const;

const similarProductsBySlug: Record<string, ProductCardData[]> = {
  "govyazhij-farsh-domashnij": [
    {
      image: "/assets/catalog/meat/miratorg/mt_pr6.png",
      brand: "Мираторг",
      title: "Стейк Рибай Прайм",
      specs: [...sharedMeatSpecs],
      tags: ["гриль", "жарка"],
      recommendation: "Рекомендуемое пиво: IPA, Porter",
      buttonLabel: "Запросить поставку",
    },
    {
      image: "/assets/catalog/meat/miratorg/mt_pr2.png",
      brand: "Мираторг",
      title: "Антрекот охлаждённый B2B",
      specs: [...sharedMeatSpecs],
      tags: ["гриль", "жарка"],
      recommendation: "Рекомендуемое пиво: IPA, Porter",
      buttonLabel: "Запросить поставку",
    },
    {
      image: "/assets/catalog/meat/miratorg/mt_pr3.png",
      brand: "Мираторг",
      title: "Гуляш из говядины",
      specs: [...sharedMeatSpecs],
      tags: ["гриль", "жарка"],
      recommendation: "Рекомендуемое пиво: IPA, Porter",
      buttonLabel: "Запросить поставку",
    },
  ],
};

const products: ProductDetailData[] = [
  {
    slug: "govyazhij-farsh-domashnij",
    breadcrumbs: [
      { label: "Главная", href: "/" },
      { label: "Каталог", href: "/#catalog" },
      { label: "Мясо", href: "/catalog/meat" },
      { label: "Primebeef", href: "/catalog/meat/primebeef" },
      { label: "Говяжий фарш домашний" },
    ],
    images: [
      "/assets/catalog/meat/miratorg/mt_pr1.png",
      "/assets/catalog/meat/miratorg/mt_hits1.png",
      "/assets/catalog/meat/miratorg/mt_ideal1.png",
      "/assets/catalog/meat/miratorg/mt_new1.png",
    ],
    brand: "Мираторг",
    category: "Мраморная говядина",
    title: "Говяжий фарш домашний",
    packaging: "1.0 кг",
    description: "Охлаждённый фарш для бургеров, котлет и домашних мясных блюд.",
    shelfLife: "15 суток в вакууме",
    storage: "Хранить при t° от 0°C до +4°C",
    cookingMethods: ["Жарка", "Запекание"],
    beerRecommendationLabel: "Рекомендуемое пиво",
    buttonLabel: "Запросить поставку",
    buttonHref: "/#contacts",
  },
];

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug) ?? null;
}

export function getAllProductSlugs() {
  return products.map((product) => product.slug);
}

export function getSimilarProducts(slug: string) {
  return similarProductsBySlug[slug] ?? [];
}

export const GOVYAZHIJ_FARSH_SLUG = "govyazhij-farsh-domashnij";
