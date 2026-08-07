import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ProductDetailHero } from "@/components/ProductDetailHero";
import { ProductCardsSection } from "@/components/ProductCardsSection";
import { SubscribeSection } from "@/components/SubscribeSection";
import { getAllProductSlugs, getProductBySlug, getSimilarProducts } from "@/lib/catalog";
import homeStyles from "@/app/home.module.css";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllProductSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return { title: "Товар не найден — Genlix" };
  }

  return {
    title: `${product.title} — каталог Genlix`,
    description: product.description,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const similarProducts = getSimilarProducts(slug);

  return (
    <main className={homeStyles.page}>
      <Header activeLink="Каталог" static />
      <Breadcrumbs items={product.breadcrumbs} />
      <ProductDetailHero product={product} />
      {similarProducts.length > 0 ? (
        <ProductCardsSection title="Похожие товары" products={similarProducts} />
      ) : null}
      <SubscribeSection />
      <Footer />
    </main>
  );
}
