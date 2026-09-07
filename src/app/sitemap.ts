import type { MetadataRoute } from "next";

import { getPublishedSitemapEntries } from "@/lib/cms/repository";
import { getAbsoluteSiteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

const staticRoutes = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/catalog/meat", changeFrequency: "weekly", priority: 0.9 },
  { path: "/catalog/meat/beef", changeFrequency: "weekly", priority: 0.85 },
  { path: "/catalog/bird", changeFrequency: "weekly", priority: 0.8 },
  { path: "/catalog/beer", changeFrequency: "weekly", priority: 0.8 },
  { path: "/news", changeFrequency: "weekly", priority: 0.75 },
  { path: "/about", changeFrequency: "monthly", priority: 0.6 },
  { path: "/partners", changeFrequency: "monthly", priority: 0.6 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { news, productSlugs } = await getPublishedSitemapEntries();

  return [
    ...staticRoutes.map(({ path, ...route }) => ({
      ...route,
      url: getAbsoluteSiteUrl(path),
    })),
    ...productSlugs.map((slug) => ({
      url: getAbsoluteSiteUrl(`/catalog/product/${encodeURIComponent(slug)}`),
      changeFrequency: "weekly" as const,
      priority: 0.75,
    })),
    ...news.map((article) => ({
      url: getAbsoluteSiteUrl(`/news/${encodeURIComponent(article.slug)}`),
      lastModified: article.lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.65,
    })),
  ];
}
