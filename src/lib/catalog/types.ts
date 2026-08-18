import type { BreadcrumbItem } from "@/components/Breadcrumbs";
import type { ProductBadge, ProductCardData } from "@/components/ProductCard";

export type ProductSpec = {
  label: string;
  value: string;
};

export type MeatSalesChannel = "horeca" | "retail";

export type MeatSpecies = "beef" | "pork" | "poultry";

export type MeatProductType =
  | "steak"
  | "large-cut"
  | "minced-meat"
  | "goulash"
  | "fillet"
  | "cutlets";

export type MeatPackaging = "large-block" | "fixed-weight-vacuum" | "tray-or-box";

export type MeatCookingMethod = "grill" | "fry" | "braise" | "bake" | "boil";

export type MeatProductMetadata = {
  channel: MeatSalesChannel;
  species: MeatSpecies;
  productType: MeatProductType;
  packaging: MeatPackaging;
  cutIds: string[];
  cooking: MeatCookingMethod[];
};

export type CatalogProduct = {
  slug: string;
  title: string;
  brand: string;
  image: string;
  specs: ProductSpec[];
  tags?: string[];
  recommendation?: string;
  buttonLabel?: string;
  badge?: ProductBadge;
  meat?: MeatProductMetadata;
};

export type ProductPlacement = {
  slug: string;
  image?: string;
  brand?: string;
  badge?: ProductBadge;
  buttonLabel?: string;
};

export type CompactCatalogProduct = {
  slug: string;
  name: string;
  meta: string;
  image: string;
};

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

export type { ProductCardData };
