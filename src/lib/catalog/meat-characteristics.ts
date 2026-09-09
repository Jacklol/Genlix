import type { ProductSpec } from "./types";

type MeatCharacteristicField = {
  name: string;
  label: string;
  placeholder?: string;
  maxLength: number;
  inputMode?: "decimal" | "numeric";
  pattern?: string;
  options?: readonly string[];
  catalogVisible?: boolean;
};

// These values use the existing specs list, so snapshots, checksums and backup
// restore keep the same schema. Labels are persisted keys: do not rename them
// without migrating existing values. New detail-only fields never expand tiles.
export const meatCharacteristicFields: readonly MeatCharacteristicField[] = [
  {
    name: "meatCondition",
    label: "Состояние",
    maxLength: 80,
    options: ["Охлаждённое", "Замороженное", "Охлаждённое / замороженное"],
  },
  { name: "meatGrade", label: "Сорт / категория качества", placeholder: "Например, Top Choice", maxLength: 120 },
  { name: "meatMarbling", label: "Мраморность", placeholder: "По спецификации производителя", maxLength: 120, catalogVisible: true },
  { name: "meatUnitWeight", label: "Вес единицы, кг", placeholder: "Например, 0,8 или 0,8–1,2", maxLength: 80 },
  { name: "meatBoxWeight", label: "Вес коробки, кг", placeholder: "Например, 15 или 15–20", maxLength: 80 },
  { name: "meatUnitsPerPack", label: "Количество в упаковке, шт.", placeholder: "Например, 10", maxLength: 8, inputMode: "numeric", pattern: "[1-9][0-9]*" },
  { name: "meatArticle", label: "Артикул", maxLength: 120 },
  { name: "meatGtin", label: "GTIN-13 (штрихкод)", placeholder: "13 цифр с упаковки", maxLength: 13, inputMode: "numeric", pattern: "[0-9]{13}" },
  { name: "meatVl", label: "VL, %", placeholder: "Например, 98", maxLength: 6, inputMode: "decimal" },
];

export function getMeatCharacteristicValue(specs: ProductSpec[], name: string) {
  const field = meatCharacteristicFields.find((item) => item.name === name);
  return field ? specs.find((spec) => spec.label === field.label)?.value ?? "" : "";
}

export function getMeatDetailSpecs(specs: ProductSpec[]): ProductSpec[] {
  return meatCharacteristicFields.flatMap((field) => {
    const value = getMeatCharacteristicValue(specs, field.name).trim();
    return value && value !== "—" ? [{ label: field.label, value }] : [];
  });
}

export function getMeatCatalogSpecs(specs: ProductSpec[]): ProductSpec[] {
  return specs.filter((spec) => !meatCharacteristicFields.some(
    (field) => !field.catalogVisible && field.label === spec.label,
  ));
}

export function getUnmanagedMeatSpecs(specs: ProductSpec[]): ProductSpec[] {
  return specs.filter((spec) => !meatCharacteristicFields.some(
    (field) => field.label === spec.label,
  ));
}
