export const PARTNERS_MAP_IMAGE = "/assets/about/map.png";

export const PARTNERS_MAP_VIEWBOX = {
  width: 1448,
  height: 1086,
} as const;

export type PartnerLocation = {
  id: string;
  name: string;
  address: string;
  website?: string;
  websiteUrl?: string;
  instagram?: string;
  instagramUrl?: string;
  x: number;
  y: number;
};

export const partnerLocations: PartnerLocation[] = [
  {
    id: "grodno",
    name: "STEIK HOUSE №3",
    address: "г. Гродно, ул. Ожешко, 12",
    website: "steakhouse-grodno.ru",
    websiteUrl: "https://steakhouse-grodno.ru",
    instagram: "@steakhouse_grodno",
    instagramUrl: "https://instagram.com/steakhouse_grodno",
    x: 16,
    y: 48,
  },
  {
    id: "minsk",
    name: "STEIK HOUSE №2",
    address: "г. Минск, ул. Немига, 5",
    website: "steakhouse-minsk.ru",
    websiteUrl: "https://steakhouse-minsk.ru",
    instagram: "@steakhouse_minsk",
    instagramUrl: "https://instagram.com/steakhouse_minsk",
    x: 47,
    y: 45,
  },
  {
    id: "vitebsk",
    name: "STEIK HOUSE №4",
    address: "г. Витебск, ул. Ленина, 33",
    website: "steakhouse-vitebsk.ru",
    websiteUrl: "https://steakhouse-vitebsk.ru",
    instagram: "@steakhouse_vitebsk",
    instagramUrl: "https://instagram.com/steakhouse_vitebsk",
    x: 69,
    y: 21,
  },
  {
    id: "mogilev",
    name: "STEIK HOUSE №1",
    address: "г. Могилев, ул. Гастрономическая, 21",
    website: "steakhouse-one.ru",
    websiteUrl: "https://steakhouse-one.ru",
    instagram: "@steakhouse_no1",
    instagramUrl: "https://instagram.com/steakhouse_no1",
    x: 71,
    y: 45,
  },
  {
    id: "brest",
    name: "STEIK HOUSE №5",
    address: "г. Брест, ул. Советская, 48",
    website: "steakhouse-brest.ru",
    websiteUrl: "https://steakhouse-brest.ru",
    instagram: "@steakhouse_brest",
    instagramUrl: "https://instagram.com/steakhouse_brest",
    x: 15.0,
    y: 73.8,
  },
  {
    id: "gomel",
    name: "STEIK HOUSE №6",
    address: "г. Гомель, ул. Пролетарская, 17",
    website: "steakhouse-gomel.ru",
    websiteUrl: "https://steakhouse-gomel.ru",
    instagram: "@steakhouse_gomel",
    instagramUrl: "https://instagram.com/steakhouse_gomel",
    x: 76,
    y: 69,
  },
];
