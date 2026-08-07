import type { BreadcrumbItem } from "@/components/Breadcrumbs";

import { catalogProducts } from "./products";
import type { CatalogProduct, ProductDetailData } from "./types";

type ProductGroup = "miratorg" | "primebeef" | "beer" | "bird";

const groupConfig: Record<ProductGroup, { breadcrumbs: BreadcrumbItem[]; category: string }> = {
  miratorg: {
    category: "Мраморная говядина",
    breadcrumbs: [
      { label: "Главная", href: "/" },
      { label: "Каталог", href: "/#catalog" },
      { label: "Мясо", href: "/catalog/meat" },
      { label: "Мираторг", href: "/catalog/meat/miratorg" },
    ],
  },
  primebeef: {
    category: "Премиальная говядина",
    breadcrumbs: [
      { label: "Главная", href: "/" },
      { label: "Каталог", href: "/#catalog" },
      { label: "Мясо", href: "/catalog/meat" },
      { label: "Primebeef", href: "/catalog/meat/primebeef" },
    ],
  },
  beer: {
    category: "Пиво",
    breadcrumbs: [
      { label: "Главная", href: "/" },
      { label: "Каталог", href: "/#catalog" },
      { label: "Пиво", href: "/catalog/beer" },
    ],
  },
  bird: {
    category: "Птица",
    breadcrumbs: [
      { label: "Главная", href: "/" },
      { label: "Каталог", href: "/#catalog" },
      { label: "Птица", href: "/catalog/bird" },
    ],
  },
};

const productGroups = {
  "govyazhij-farsh-domashnij": "miratorg",
  "antrekot-ohlazhdyonnyj-b2b": "miratorg",
  "gulyash-iz-govyadiny": "miratorg",
  "file-kurinoe-ohlazhdennoye": "miratorg",
  "kotlety-domashnie-iz-svininy": "miratorg",
  "steyk-ribaj-prajm": "miratorg",
  "steyk-striploin": "primebeef",
  "file-minon-tenderloin": "primebeef",
  "steyk-ribaj-prajm-primebeef": "primebeef",
  "tolstyj-kraj": "primebeef",
  "steyk-ribaj-v-vakuume": "primebeef",
  "steyk-nyu-york": "primebeef",
  "paulaner-hefe-weissbier": "beer",
  "guinness-draught": "beer",
  "chimay-blue": "beer",
  "pilsner-urquell": "beer",
  "brewdog-punk-ipa": "beer",
  "hoegaarden": "beer",
  "file-kurinoe-fermerskoe": "bird",
  "utinaya-grudka": "bird",
  "indejka-file-grudki": "bird",
  "perepel-tushka": "bird",
  "kurinye-bedra": "bird",
  "krylya-kurinye": "bird",
} satisfies Record<keyof typeof catalogProducts, ProductGroup>;

const detailOverrides: Partial<Record<keyof typeof catalogProducts, Partial<ProductDetailData>>> = {
  "govyazhij-farsh-domashnij": {
    images: [
      "/assets/catalog/meat/miratorg/mt_pr1.png",
      "/assets/catalog/meat/miratorg/mt_hits1.png",
      "/assets/catalog/meat/miratorg/mt_ideal1.png",
      "/assets/catalog/meat/miratorg/mt_new1.png",
    ],
    packaging: "1.0 кг",
    description: "Охлаждённый фарш для бургеров, котлет и домашних мясных блюд.",
    shelfLife: "15 суток в вакууме",
    storage: "Хранить при t° от 0°C до +4°C",
    cookingMethods: ["Жарка", "Запекание"],
    beerRecommendationLabel: "Рекомендуемое пиво",
    buttonLabel: "Запросить поставку",
  },
};

function getSpecValue(product: CatalogProduct, label: string) {
  return product.specs.find((spec) => spec.label === label)?.value;
}

function buildCookingMethods(tags?: string[]) {
  if (!tags?.length) {
    return ["Гриль"];
  }

  return tags.map((tag) => tag.charAt(0).toUpperCase() + tag.slice(1));
}

function buildProductDetail(product: CatalogProduct, group: ProductGroup): ProductDetailData {
  const config = groupConfig[group];
  const packaging = getSpecValue(product, "Фасовка") ?? getSpecValue(product, "Упаковка") ?? "—";
  const storageValue = getSpecValue(product, "Хранение");

  return {
    slug: product.slug,
    breadcrumbs: [...config.breadcrumbs, { label: product.title }],
    images: [product.image],
    brand: product.brand,
    category: config.category,
    title: product.title,
    packaging,
    description: `Поставка «${product.title}» для ресторанов, баров и розничных сетей.`,
    shelfLife: getSpecValue(product, "Срок годности") ?? "Согласно маркировке",
    storage: storageValue ? `Хранить при ${storageValue}` : "Хранить согласно условиям на упаковке",
    cookingMethods: buildCookingMethods(product.tags),
    beerRecommendationLabel:
      group !== "beer" && product.recommendation?.toLowerCase().includes("пиво")
        ? "Рекомендуемое пиво"
        : undefined,
    buttonLabel: product.buttonLabel ?? "Запросить поставку",
    buttonHref: "/#contacts",
  };
}

export const productDetails: ProductDetailData[] = Object.entries(catalogProducts).map(([slug, product]) => {
  const group = productGroups[slug as keyof typeof catalogProducts];
  const base = buildProductDetail(product, group);
  const override = detailOverrides[slug as keyof typeof catalogProducts];

  return override ? { ...base, ...override, slug: product.slug } : base;
});

export const productDetailSlugs = new Set(productDetails.map((product) => product.slug));
