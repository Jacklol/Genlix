import type { CompactCatalogProduct, ProductPlacement } from "./types";

export const miratorgSections = {
  detailed: [
    { slug: "govyazhij-farsh-domashnij" },
    { slug: "antrekot-ohlazhdyonnyj-b2b" },
    { slug: "gulyash-iz-govyadiny" },
    { slug: "file-kurinoe-ohlazhdennoye" },
    { slug: "kotlety-domashnie-iz-svininy" },
    { slug: "steyk-ribaj-prajm" },
  ] satisfies ProductPlacement[],
  hits: [
    { slug: "govyazhij-farsh-domashnij", image: "/assets/catalog/meat/miratorg/mt_hits1.png", badge: "хит" },
    { slug: "steyk-ribaj-prajm", image: "/assets/catalog/meat/miratorg/mt_hits2.png", badge: "хит" },
    { slug: "gulyash-iz-govyadiny", image: "/assets/catalog/meat/miratorg/mt_hits3.png", badge: "хит" },
  ] satisfies ProductPlacement[],
  new: [
    { slug: "file-kurinoe-ohlazhdennoye", image: "/assets/catalog/meat/miratorg/mt_new1.png", badge: "new" },
    { slug: "kotlety-domashnie-iz-svininy", image: "/assets/catalog/meat/miratorg/mt_new2.png", badge: "new" },
    { slug: "steyk-ribaj-prajm", image: "/assets/catalog/meat/miratorg/mt_new3.png", badge: "new" },
  ] satisfies ProductPlacement[],
  showcase: [
    { slug: "govyazhij-farsh-domashnij", image: "/assets/catalog/meat/miratorg/mt_ideal1.png", badge: "витрина" },
    { slug: "gulyash-iz-govyadiny", image: "/assets/catalog/meat/miratorg/mt_ideal2.png", badge: "витрина" },
    {
      slug: "kotlety-domashnie-iz-svininy",
      image: "/assets/catalog/meat/miratorg/mt_ideal3.png",
      badge: "витрина",
    },
  ] satisfies ProductPlacement[],
} as const;

export const primebeefSections = {
  detailed: [
    { slug: "steyk-ribaj-prajm-primebeef" },
    { slug: "steyk-striploin" },
    { slug: "file-minon-tenderloin" },
  ] satisfies ProductPlacement[],
  horeca: [
    { slug: "tolstyj-kraj", image: "/assets/catalog/meat/primebeef/primebeef4.png" },
    { slug: "tolstyj-kraj", image: "/assets/catalog/meat/primebeef/primebeef5.png" },
    { slug: "tolstyj-kraj", image: "/assets/catalog/meat/primebeef/primebeef6.png" },
  ] satisfies ProductPlacement[],
  retail: [
    { slug: "steyk-ribaj-v-vakuume", image: "/assets/catalog/meat/primebeef/pb1.png" },
    { slug: "steyk-nyu-york", image: "/assets/catalog/meat/primebeef/pb2.png" },
    { slug: "steyk-ribaj-v-vakuume", image: "/assets/catalog/meat/primebeef/pb3.png" },
    { slug: "steyk-nyu-york", image: "/assets/catalog/meat/primebeef/pb4.png" },
  ] satisfies ProductPlacement[],
} as const;

export const beerSection = [
  { slug: "paulaner-hefe-weissbier" },
  { slug: "guinness-draught" },
  { slug: "chimay-blue" },
  { slug: "pilsner-urquell" },
  { slug: "brewdog-punk-ipa" },
  { slug: "hoegaarden" },
] satisfies ProductPlacement[];

export const birdSection = [
  { slug: "file-kurinoe-fermerskoe" },
  { slug: "utinaya-grudka" },
  { slug: "indejka-file-grudki" },
  { slug: "perepel-tushka" },
  { slug: "kurinye-bedra" },
  { slug: "krylya-kurinye" },
] satisfies ProductPlacement[];

const horecaMeta = "Блок 5.5 кг • Мраморность 4+";
const retailRibeyeMeta = "Порция 0.8 кг • Фикс. вес";

export const primebeefHorecaCompact: CompactCatalogProduct[] = [
  { slug: "tolstyj-kraj", name: "Толстый край", meta: horecaMeta, image: "/assets/catalog/meat/primebeef/primebeef4.png" },
  { slug: "tolstyj-kraj", name: "Толстый край", meta: horecaMeta, image: "/assets/catalog/meat/primebeef/primebeef5.png" },
  { slug: "tolstyj-kraj", name: "Толстый край", meta: horecaMeta, image: "/assets/catalog/meat/primebeef/primebeef6.png" },
];

export const primebeefRetailCompact: CompactCatalogProduct[] = [
  { slug: "steyk-ribaj-v-vakuume", name: "Стейк Рибай в вакууме", meta: retailRibeyeMeta, image: "/assets/catalog/meat/primebeef/pb1.png" },
  { slug: "steyk-nyu-york", name: "Стейк Нью-Йорк", meta: retailRibeyeMeta, image: "/assets/catalog/meat/primebeef/pb2.png" },
  { slug: "steyk-ribaj-v-vakuume", name: "Стейк Рибай в вакууме", meta: retailRibeyeMeta, image: "/assets/catalog/meat/primebeef/pb3.png" },
  { slug: "steyk-nyu-york", name: "Стейк Нью-Йорк", meta: retailRibeyeMeta, image: "/assets/catalog/meat/primebeef/pb4.png" },
];

export const similarProductsBySlug: Record<string, ProductPlacement[]> = {
  "govyazhij-farsh-domashnij": [
    { slug: "steyk-ribaj-prajm" },
    { slug: "antrekot-ohlazhdyonnyj-b2b" },
    { slug: "gulyash-iz-govyadiny" },
  ],
};
