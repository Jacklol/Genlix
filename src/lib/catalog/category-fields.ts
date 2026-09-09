import type { ProductSpec } from "./types";

export type CatalogCategory = "meat" | "bird" | "beer" | "water";
export type FilteredCategory = Exclude<CatalogCategory, "meat">;
export const categoryLabels: Record<CatalogCategory, string> = {
  meat: "Мясо", bird: "Птица", beer: "Пиво", water: "Вода",
};

export type CategoryField = {
  name: string;
  label: string;
  options?: readonly string[];
  filter?: string;
  primary?: boolean;
  numeric?: "integer" | "decimal" | "percent";
  placeholder?: string;
  card?: boolean;
};

// Labels are persisted in specs, just like the existing meat characteristics.
// The editor, public details and filters share these definitions: no second copy
// of a product attribute, destructive migration or guessing from product titles.
const commonFields: CategoryField[] = [
  { name: "catalogCountry", label: "Страна производства", filter: "country", placeholder: "Например, Россия" },
  { name: "catalogChannel", label: "Формат поставки", filter: "channel", options: ["HoReCa", "Ритейл", "HoReCa / ритейл"] },
];
const article: CategoryField = { name: "catalogArticle", label: "Артикул" };
const units: CategoryField = { name: "catalogUnits", label: "Количество в упаковке, шт.", numeric: "integer" };
const volume: CategoryField = { name: "catalogVolume", label: "Объём, мл", numeric: "integer", filter: "volume", placeholder: "500", card: true };

export const categoryFields: Record<FilteredCategory, CategoryField[]> = {
  bird: [
    { name: "birdSpecies", label: "Вид птицы", filter: "birdSpecies", primary: true, options: ["Курица", "Утка", "Индейка", "Перепел", "Гусь", "Другая птица"], card: true },
    { name: "birdPart", label: "Часть / разделка", filter: "part", primary: true, options: ["Тушка", "Филе", "Грудка", "Бедро", "Голень", "Крылья", "Окорочок", "Фарш", "Субпродукты", "Другое"], card: true },
    ...commonFields,
    { name: "birdCondition", label: "Состояние", filter: "condition", options: ["Охлаждённое", "Замороженное", "Охлаждённое / замороженное"] },
    { name: "birdPackaging", label: "Тип упаковки", filter: "packaging", options: ["Вакуум", "Лоток", "Пакет", "Короб"] },
    { name: "birdUnitWeight", label: "Вес единицы, кг", placeholder: "0,8–1,2" },
    { name: "birdBoxWeight", label: "Вес коробки, кг", placeholder: "10" },
    units, article,
  ],
  beer: [
    { name: "beerStyle", label: "Стиль пива", filter: "style", primary: true, options: ["Лагер", "Пшеничное", "IPA", "Эль", "Стаут", "Портер", "Ламбик", "Другое"], card: true },
    { name: "beerAlcohol", label: "Алкогольность", filter: "alcohol", primary: true, options: ["Алкогольное", "Безалкогольное"] },
    ...commonFields,
    { name: "beerPackaging", label: "Тип упаковки", filter: "packaging", options: ["Бутылка", "Банка", "Кег"] },
    volume,
    { name: "beerAbv", label: "Крепость (Алкоголь)", numeric: "percent", placeholder: "5,5%", card: true },
    { name: "beerIbu", label: "Горечь (IBU)", numeric: "decimal", placeholder: "35", card: true },
    { ...units, label: "Количество в коробе, шт." }, article,
  ],
  water: [
    { name: "waterType", label: "Вид воды", filter: "waterType", primary: true, options: ["Питьевая", "Минеральная"], card: true },
    { name: "waterGas", label: "Газированность", filter: "carbonation", primary: true, options: ["Негазированная", "Слабогазированная", "Газированная"], card: true },
    ...commonFields,
    { name: "waterPackaging", label: "Тип упаковки", filter: "packaging", options: ["Стекло", "ПЭТ"] },
    volume,
    { name: "waterMineralization", label: "Минерализация, г/л", placeholder: "0,2–0,5" },
    { ...units, label: "Бутылок в упаковке, шт." }, article,
  ],
};

export const allCategoryFields = Object.values(categoryFields).flat();
export function hasSpecValue(value?: string) {
  return Boolean(value?.trim() && !["—", "-"].includes(value.trim()));
}
export function fieldValue(specs: ProductSpec[], field: CategoryField) {
  return specs.find((spec) => spec.label === field.label)?.value ?? "";
}
export function unmanagedCategorySpecs(specs: ProductSpec[]) {
  const labels = new Set(allCategoryFields.map((field) => field.label));
  return specs.filter((spec) => !labels.has(spec.label));
}
export function categoryDetailSpecs(category: FilteredCategory, specs: ProductSpec[]) {
  return categoryFields[category].flatMap((field) => {
    const value = fieldValue(specs, field);
    return hasSpecValue(value) ? [{ label: field.label, value }] : [];
  });
}

export const countryLabels: Record<string, string> = {
  argentina: "Аргентина", belarus: "Беларусь", brazil: "Бразилия", russia: "Россия",
  uruguay: "Уругвай", germany: "Германия", belgium: "Бельгия", czechia: "Чехия",
  france: "Франция", italy: "Италия", uk: "Великобритания", ireland: "Ирландия",
  poland: "Польша", turkey: "Турция", georgia: "Грузия", armenia: "Армения",
};
export function normalizeCountry(value: string) {
  const normalized = value.trim().toLocaleLowerCase("ru");
  return Object.entries(countryLabels).find(([code, label]) => code === normalized || label.toLocaleLowerCase("ru") === normalized)?.[0] ?? normalized;
}
