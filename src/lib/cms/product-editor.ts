export type ProductEditorState = { error: string } | null;
export type ProductImageUploadResult = { url: string; error?: never } | { error: string; url?: never };

export const MAX_PRODUCT_IMAGES = 51; // Main image + up to 50 gallery entries.
export const MAX_PRODUCT_IMAGE_BYTES = 3 * 1024 * 1024;
export const PRODUCT_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function initialProductImages(main: string, gallery: string[]) {
  return Array.from(new Set([main, ...gallery].filter(Boolean)));
}

export function moveProductImage<T>(images: T[], from: number, to: number): T[] {
  if (from < 0 || to < 0 || from >= images.length || to >= images.length || from === to) return images;
  const result = [...images];
  const [item] = result.splice(from, 1);
  result.splice(to, 0, item);
  return result;
}
