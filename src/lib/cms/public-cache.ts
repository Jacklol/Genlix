import { unstable_cache } from "next/cache";

import { PUBLIC_CMS_CACHE_TAG, publicCmsCacheGeneration } from "./cache-tags";
import { getCmsBackendMode, loadAdminCmsSnapshot, loadCmsSnapshot, type CmsSnapshotResult } from "./store";

export const PUBLIC_CMS_CACHE_SECONDS = 10 * 60;

type CachedSnapshot = { result: CmsSnapshotResult; expiresAt: number };
const pending = new Map<string, Promise<CachedSnapshot>>();

function refreshSnapshot(source: string): Promise<CachedSnapshot> {
  const generation = publicCmsCacheGeneration();
  const key = `${source}:${generation}`;
  const existing = pending.get(key);
  if (existing) return existing;

  const promise = (async () => {
    // This read has no stale fallback. Admin reads remain outside this cache.
    const result = await loadAdminCmsSnapshot();
    if (!result || result.mode !== "supabase" || !result.writable) {
      throw new Error("Не удалось загрузить актуальный каталог из базы данных");
    }
    // A concurrent publication must not refill the cache with a pre-save read.
    if (generation !== publicCmsCacheGeneration()) return refreshSnapshot(source);
    return { result, expiresAt: Date.now() + PUBLIC_CMS_CACHE_SECONDS * 1_000 };
  })();
  pending.set(key, promise);
  void promise.finally(() => {
    if (pending.get(key) === promise) pending.delete(key);
  }).catch(() => {});
  return promise;
}

const cachedSnapshot = unstable_cache(refreshSnapshot, ["published-cms-v1"], {
  revalidate: PUBLIC_CMS_CACHE_SECONDS,
  tags: [PUBLIC_CMS_CACHE_TAG],
});

export async function loadPublicCmsSnapshot(): Promise<CmsSnapshotResult> {
  // Local editing stays immediate, and a build without database credentials
  // cannot populate the live database's cache with the source seed.
  if (getCmsBackendMode() !== "supabase") return loadCmsSnapshot();
  const source = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const entry = await cachedSnapshot(source);
  // Next can return an expired entry while revalidating. Enforce the agreed
  // ten-minute limit: after it expires, return fresh data or the visible error.
  return Date.now() < entry.expiresAt ? entry.result : (await refreshSnapshot(source)).result;
}
