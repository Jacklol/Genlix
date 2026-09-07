import {
  getPublishedMeatItems,
  getPublishedProductBySlug,
} from "@/lib/cms/repository";

import type { ContactProductContext } from "./types";

export async function getContactProductContext(
  slug: string | undefined,
): Promise<ContactProductContext | undefined> {
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return undefined;
  }

  const [product, meatItems] = await Promise.all([
    getPublishedProductBySlug(slug),
    getPublishedMeatItems(),
  ]);

  if (!product) {
    return undefined;
  }

  const meatItem = meatItems.find((item) => item.slug === slug);

  return {
    ...(meatItem?.meat.channel ? { channel: meatItem.meat.channel } : {}),
    slug,
    title: product.title,
  };
}
