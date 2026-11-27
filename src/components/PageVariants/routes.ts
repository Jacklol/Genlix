import { aboutLooks } from "./aboutLooks";
import { contactLooks } from "./contactLooks";

export type VariantPage = "contacts" | "about";
export type VariantChoice = { value: string; label: string };

export const contactChoices = [
  { value: "original", label: "Текущая версия" },
  ...contactLooks.map(({ name }, i) => ({ value: String(i + 1), label: `${i + 1}. ${name}` })),
];
export const aboutChoices = [
  { value: "1", label: "Текущая версия · Светлый" },
  { value: "2", label: "Предыдущий · Синий" },
  { value: "3", label: "Предыдущий · Минимум" },
  { value: "original", label: "Исходная версия" },
  ...aboutLooks.map(({ name }, i) => ({
    value: `look-${String(i + 1).padStart(2, "0")}`, label: `${i + 1}. ${name}`,
  })),
];
