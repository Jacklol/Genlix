export const MAX_PRODUCT_VIDEOS = 50;
export const PRODUCT_VIDEO_FILE_SIZE_MB = 50;

export type ProductVideo =
  | { type: "youtube"; url: string; id: string }
  | { type: "file"; url: string; format: "mp4" | "webm" };

const youtubeHosts = new Set([
  "youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com",
  "youtube-nocookie.com", "www.youtube-nocookie.com",
]);

/** Extract only a single YouTube video, never an arbitrary embed URL or playlist. */
export function getYouTubeVideoId(source: string): string | null {
  if (source.length > 2_000) return null;

  let url: URL;
  try {
    url = new URL(source.trim());
  } catch {
    return null;
  }

  if (url.protocol !== "https:" || url.username || url.password || url.port) return null;

  let id: string | null = null;
  if (url.hostname === "youtu.be") {
    id = /^\/([A-Za-z0-9_-]{11})\/?$/.exec(url.pathname)?.[1] ?? null;
  } else if (youtubeHosts.has(url.hostname)) {
    id = url.pathname === "/watch"
      ? url.searchParams.get("v")
      : /^\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{11})\/?$/.exec(url.pathname)?.[1] ?? null;
  }

  return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
}

export function normalizeYouTubeVideoUrl(source: string): string | null {
  const id = getYouTubeVideoId(source);
  return id ? `https://www.youtube.com/watch?v=${id}` : null;
}

export function getProductVideo(source: string): ProductVideo | null {
  const id = getYouTubeVideoId(source);
  if (id) return { type: "youtube", url: `https://www.youtube.com/watch?v=${id}`, id };
  if (source.length > 2_000) return null;

  let url: URL;
  try {
    url = new URL(source.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port) return null;

  const format = /\.(mp4|webm)$/i.exec(url.pathname)?.[1].toLowerCase();
  if (format !== "mp4" && format !== "webm") return null;
  return { type: "file", url: url.href, format };
}

export function normalizeProductVideoUrl(source: string): string | null {
  return getProductVideo(source)?.url ?? null;
}
