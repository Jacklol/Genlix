export const HERO_MAP_INTRO_MS = 10_000;

/** First three routes start together; each later group stays on the map. */
export function getGrowingRouteDelayMs(index: number): number {
  if (index < 3) return 0;
  if (index < 6) return 1800;
  if (index < 9) return 3500;
  if (index < 13) return 5200;
  return 6900;
}

// The first 59 frames (24 fps) were removed with a lossless MP4 trim.
// Keep the original hero-video.mp4 for the separate version 3 preview.
export const HERO_VIDEO_TRIM_SECONDS = 59 / 24;
export const HERO_STORY_VIDEO_SRC = "/assets/home/hero-video-story.mp4";

// The animated map is its own scene, not part of the video timeline.
export const heroMapScene = {
  id: "geography",
  eyebrow: "География поставок / Беларусь",
  title: "Премиальные продукты —\nнапрямую в Беларусь",
  text: "Мясо, птица, пиво и вода от проверенных производителей для HoReCa и ритейла.",
} as const;

// Original scene cues, shifted to the trimmed video's timeline (~12.6 seconds).
// Use the video's currentTime so pauses, buffering and loops cannot desync the copy.
export const heroStoryScenes = [
  {
    id: "delivery",
    startsAt: 0,
    eyebrow: "Genlix / Логистика",
    title: "Бережная доставка —\nна каждом этапе",
    text: "От погрузки до приёмки — сохраняем качество каждой партии.",
  },
  {
    id: "meat",
    startsAt: 5.5 - HERO_VIDEO_TRIM_SECONDS,
    eyebrow: "Genlix / Мясо и хранение",
    title: "Премиальное мясо\nдля вашего бизнеса",
    text: "Контроль хранения и температурного режима — от поставщика до вашей кухни.",
  },
  {
    id: "beer",
    startsAt: 8.1 - HERO_VIDEO_TRIM_SECONDS,
    eyebrow: "Genlix / Пиво",
    title: "Пиво с характером\nдля вашей карты",
    text: "Подбираем ассортимент для ресторанов, баров и розничных магазинов.",
  },
  {
    id: "water",
    startsAt: 11.2 - HERO_VIDEO_TRIM_SECONDS,
    eyebrow: "Genlix / Вода",
    title: "Премиальная вода —\nчистый вкус",
    text: "Для ресторанной подачи, гостиниц и полок магазинов.",
  },
  {
    id: "snacks",
    startsAt: 13.5 - HERO_VIDEO_TRIM_SECONDS,
    eyebrow: "Genlix / Гастрономия",
    title: "Детали, которые\nдополняют вкус",
    text: "Снеки и гастрономические дополнения — у одного поставщика.",
  },
] as const;

export function getHeroStorySceneIndex(currentTime: number): number {
  if (!Number.isFinite(currentTime) || currentTime < 0) return 0;
  for (let index = heroStoryScenes.length - 1; index > 0; index -= 1) {
    if (currentTime >= heroStoryScenes[index].startsAt) return index;
  }
  return 0;
}

export function getRemainingMapIntroMs(elapsedMs: number): number {
  return Math.max(0, HERO_MAP_INTRO_MS - Math.max(0, elapsedMs));
}
