import type { MetadataRoute } from "next";

import { getAbsoluteSiteUrl, getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/genlix-admin", "/api/"],
    },
    sitemap: getAbsoluteSiteUrl("/sitemap.xml"),
    host: getSiteUrl().origin,
  };
}
