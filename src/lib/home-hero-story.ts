export const HERO_MAP_INTRO_MS = 10_000;

// Cue times follow the scenes in /assets/home/hero-video.mp4 (about 15 seconds).
// Use the video's currentTime so pauses, buffering and loops cannot desync the copy.
export const heroStoryScenes = [
  {
    id: "geography",
    startsAt: 0,
    eyebrow: "География поставок / Беларусь",
    title: "Премиальные продукты —\nнапрямую в Беларусь",
    text: "Мясо, птица, пиво и вода от проверенных производителей для HoReCa и ритейла.",
  },
  {
    id: "delivery",
    startsAt: 2.4,
    eyebrow: "Genlix / Логистика",
    title: "Бережная доставка —\nна каждом этапе",
    text: "От погрузки до приёмки — сохраняем качество каждой партии.",
  },
  {
    id: "meat",
    startsAt: 5.4,
    eyebrow: "Genlix / Мясо и хранение",
    title: "Премиальное мясо\nдля вашего бизнеса",
    text: "Контроль хранения и температурного режима — от поставщика до вашей кухни.",
  },
  {
    id: "beer",
    startsAt: 8.1,
    eyebrow: "Genlix / Пиво",
    title: "Пиво с характером\nдля вашей карты",
    text: "Подбираем ассортимент для ресторанов, баров и розничных магазинов.",
  },
  {
    id: "water",
    startsAt: 11.2,
    eyebrow: "Genlix / Вода",
    title: "Премиальная вода —\nчистый вкус",
    text: "Для ресторанной подачи, гостиниц и полок магазинов.",
  },
  {
    id: "snacks",
    startsAt: 13.5,
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
