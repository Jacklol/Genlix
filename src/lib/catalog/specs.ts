import type { ProductSpec } from "./types";

export const meatSpecs: ProductSpec[] = [
  { label: "Фасовка", value: "блок 5+ кг / вакуум 0,8 кг" },
  { label: "Мраморность", value: "5" },
  { label: "Вызревание", value: "сухое вызревание 28 дней" },
  { label: "Хранение", value: "0...+4°C" },
];

export const birdSpecs: ProductSpec[] = [
  { label: "Упаковка", value: "вакуум 0,8 кг / короб 10 кг" },
  { label: "Срок годности", value: "10 суток" },
  { label: "Хранение", value: "0...+4°C" },
];
