import type { BreadcrumbItem } from "@/components/Breadcrumbs";
import type { ProductBadge, ProductCardData } from "@/components/ProductCard";

export type ProductSpec = {
  label: string;
  value: string;
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
