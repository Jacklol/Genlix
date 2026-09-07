export function getContactRequestHref(slug?: string, configuredHref?: string) {
  if (configuredHref && configuredHref !== "/#contacts" && configuredHref !== "#contacts") {
    return configuredHref;
  }

  return slug
    ? `/?product=${encodeURIComponent(slug)}#contacts`
    : configuredHref ?? "/#contacts";
}

