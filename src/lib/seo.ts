const FALLBACK_SITE_URL = "https://genlix.vercel.app";

function normalizeSiteUrl(value: string | undefined) {
  const source = value?.trim();

  if (!source) {
    return null;
  }

  try {
    const url = new URL(/^https?:\/\//i.test(source) ? source : `https://${source}`);

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return null;
    }

    url.hash = "";
    url.pathname = "/";
    url.search = "";
    url.username = "";
    url.password = "";
    return url;
  } catch {
    return null;
  }
}

/** Stable public origin used by canonical, Open Graph and crawler URLs. */
export function getSiteUrl() {
  const candidates = [
    process.env.SITE_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ];

  for (const candidate of candidates) {
    const siteUrl = normalizeSiteUrl(candidate);

    if (siteUrl) {
      return siteUrl;
    }
  }

  return new URL(FALLBACK_SITE_URL);
}

export function getAbsoluteSiteUrl(pathname: string) {
  return new URL(pathname, getSiteUrl()).toString();
}

/** Keep CMS strings from terminating the inline JSON-LD script element. */
export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
