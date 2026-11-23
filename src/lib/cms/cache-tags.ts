import { revalidateTag } from "next/cache";

export const PUBLIC_CMS_CACHE_TAG = "genlix-published-cms-v1";

let generation = 0;

export function publicCmsCacheGeneration() {
  return generation;
}

/** Used by every CMS write entry point, after the revision has been committed. */
export function invalidatePublicCmsCache() {
  generation += 1;
  // Blocking expiry works for both Server Actions and the Excel Route Handler.
  revalidateTag(PUBLIC_CMS_CACHE_TAG, { expire: 0 });
}
