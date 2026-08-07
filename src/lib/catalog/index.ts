import type { CatalogProduct } from "@/components/CatalogProductsSection";

import { productDetails, productDetailSlugs } from "./details";
import { catalogProducts } from "./products";
import {
  beerSection,
  birdSection,
  miratorgSections,
  primebeefHorecaCompact,
  primebeefRetailCompact,
  primebeefSections,
  similarProductsBySlug,
} from "./sections";
import type {
  CatalogProduct as CatalogProductRecord,
  CompactCatalogProduct,
  ProductCardData,
  ProductDetailData,
  ProductPlacement,
} from "./types";

export type { ProductDetailData, ProductCardData, CompactCatalogProduct };
export { meatSpecs, birdSpecs } from "./specs";
export { catalogProducts } from "./products";
export const GOVYAZHIJ_FARSH_SLUG = "govyazhij-farsh-domashnij";

function getProduct(slug: string): CatalogProductRecord {
  const product = catalogProducts[slug as keyof typeof catalogProducts];

  if (!product) {
    throw new Error(`Unknown catalog product slug: ${slug}`);
  }

  return product;
}

export function resolvePlacement(placement: ProductPlacement): ProductCardData {
  const product = getProduct(placement.slug);

  return {
    ...(productDetailSlugs.has(product.slug) ? { slug: product.slug } : {}),
    image: placement.image ?? product.image,
    badge: placement.badge ?? product.badge,
    brand: placement.brand ?? product.brand,
    title: product.title,
    specs: product.specs,
    tags: product.tags,
    recommendation: product.recommendation,
    buttonLabel: placement.buttonLabel ?? product.buttonLabel,
  };
}

export function resolvePlacements(placements: readonly ProductPlacement[]): ProductCardData[] {
  return placements.map(resolvePlacement);
}

export function resolveCompactProducts(items: readonly CompactCatalogProduct[]): CatalogProduct[] {
  return items.map((item) => ({
    name: item.name,
    meta: item.meta,
    image: item.image,
    ...(productDetailSlugs.has(item.slug) ? { href: `/catalog/product/${item.slug}` } : {}),
  }));
}

export function getMiratorgSection(section: keyof typeof miratorgSections) {
  return resolvePlacements(miratorgSections[section]);
}

export function getPrimebeefDetailedProducts() {
  return resolvePlacements(primebeefSections.detailed);
}

export function getPrimebeefHorecaProducts() {
  return resolveCompactProducts(primebeefHorecaCompact);
}

export function getPrimebeefRetailProducts() {
  return resolveCompactProducts(primebeefRetailCompact);
}

export function getBeerProducts() {
  return resolvePlacements(beerSection);
}

export function getBirdProducts() {
  return resolvePlacements(birdSection);
}

export function getProductBySlug(slug: string) {
  return productDetails.find((product) => product.slug === slug) ?? null;
}

export function getAllProductSlugs() {
  return productDetails.map((product) => product.slug);
}

export function getSimilarProducts(slug: string) {
  const placements = similarProductsBySlug[slug] ?? [];
  return resolvePlacements(placements);
}
