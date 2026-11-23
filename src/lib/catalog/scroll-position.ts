const STORAGE_KEY = "genlix:catalog-scroll";

export function rememberCatalogPosition() {
  if (!/^\/catalog\/(?:meat(?:\/(?:beef|lamb))?|bird|beer|water)$/.test(window.location.pathname)) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      href: window.location.pathname + window.location.search,
      top: window.scrollY,
      at: Date.now(),
    }));
  } catch {
    // Navigation also works when browser storage is unavailable.
  }
}

export function restoreCatalogPosition() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null");
    if (!saved || saved.href !== window.location.pathname + window.location.search ||
      !Number.isFinite(saved.top) || saved.top < 0 || Date.now() - saved.at > 30 * 60_000) return;
    window.scrollTo({ top: saved.top, behavior: "instant" });
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // A missing position must never interfere with opening the catalog.
  }
}
