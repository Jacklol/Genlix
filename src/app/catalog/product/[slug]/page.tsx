import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ProductDetailHero } from "@/components/ProductDetailHero";
import { ProductCardsSection } from "@/components/ProductCardsSection";
import { SubscribeSection } from "@/components/SubscribeSection";
import {
  getPublishedProductBySlug,
  getPublishedProductSlugs,
  getPublishedSimilarProducts,
} from "@/lib/cms/repository";
import { getAbsoluteSiteUrl, serializeJsonLd } from "@/lib/seo";
import homeStyles from "@/app/home.module.css";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return (await getPublishedProductSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublishedProductBySlug(slug);

  if (!product) {
    return {
      title: "Товар не найден — Genlix",
      robots: { follow: false, index: false },
    };
  }

  const canonicalPath = `/catalog/product/${encodeURIComponent(product.slug)}`;
  const image = getAbsoluteSiteUrl(product.images[0] ?? "/assets/home/category-meat.png");
  const title = `${product.title} — каталог Genlix`;

  return {
    title,
    description: product.description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      type: "website",
      locale: "ru_RU",
      siteName: "Genlix",
      title,
      description: product.description,
      url: canonicalPath,
      images: [{ url: image, alt: product.title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: product.description,
      images: [image],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getPublishedProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const similarProducts = await getPublishedSimilarProducts(slug);
  const canonicalUrl = getAbsoluteSiteUrl(
    `/catalog/product/${encodeURIComponent(product.slug)}`,
  );
  const productImages = product.images.length
    ? product.images.map(getAbsoluteSiteUrl)
    : [getAbsoluteSiteUrl("/assets/home/category-meat.png")];
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": `${canonicalUrl}#product`,
        name: product.title,
        description: product.description,
        image: productImages,
        sku: product.slug,
        category: product.category,
        brand: {
          "@type": "Brand",
          name: product.brand,
        },
        additionalProperty: [
          {
            "@type": "PropertyValue",
            name: "Фасовка",
            value: product.packaging,
          },
          {
            "@type": "PropertyValue",
            name: "Срок годности",
            value: product.shelfLife,
          },
          {
            "@type": "PropertyValue",
            name: "Условия хранения",
            value: product.storage,
          },
        ],
        url: canonicalUrl,
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${canonicalUrl}#breadcrumbs`,
        itemListElement: product.breadcrumbs.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.label,
          item: item.href ? getAbsoluteSiteUrl(item.href) : canonicalUrl,
        })),
      },
    ],
  };

  return (
    <main className={homeStyles.page}>
      <script
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }}
        type="application/ld+json"
      />
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
