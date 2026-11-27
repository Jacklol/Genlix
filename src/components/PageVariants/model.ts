export type Scene =
  | "split" | "cover" | "ledger" | "center" | "map" | "inbox"
  | "tabs" | "mosaic" | "rail" | "stack" | "poster" | "steps"
  | "form" | "diptych" | "reverse" | "ticker" | "caption" | "statement";

export type Palette = "navy" | "ivory" | "ice" | "cobalt" | "slate" | "paper";
export type Effect = "rise" | "wipe" | "photo" | "stagger" | "fade" | "none";
export type Detail = readonly [title: string, text: string];
export type Media = keyof typeof photography;
export type ContactBlock = "direct" | "visit" | "topics" | "request" | "legal" | "cities";
export type AboutBlock = "story" | "range" | "care" | "workflow" | "audience" | "quality";
export type Focus = "phone" | "email" | "route" | "request" | "catalog" | "social" | "work";

export type Concept<Block extends string> = {
  name: string;
  scene: Scene;
  palette: Palette;
  effect: Effect;
  title: string;
  lead: string;
  image?: Media;
  second?: Media;
  focus: Focus;
  details: readonly Detail[];
  sections: readonly Block[];
};

export const photography = {
  office: ["/assets/variants/office.webp", "Светлая переговорная с видом на город"],
  kitchen: ["/assets/variants/kitchen.webp", "Подготовка мясного отруба на профессиональной кухне"],
  logistics: ["/assets/variants/logistics.webp", "Стеллажи распределительного склада"],
  table: ["/assets/variants/table.webp", "Мраморное мясо на тёмной рабочей поверхности"],
  community: ["/assets/variants/community.webp", "Волонтёры укладывают продукты в коробки"],
  storage: ["/assets/about/control2.png", "Хранение продукции на складе"],
  control: ["/assets/about/control1.png", "Проверка продукции"],
  packing: ["/assets/about/control3.png", "Рабочий процесс на производстве"],
  meat: ["/assets/about/video_cover.png", "Работа с мясной продукцией"],
  market: ["/assets/about/hero.png", "Мясная продукция для профессиональной кухни"],
  chicken: ["/assets/home/category2.jpg", "Птица для профессиональной кухни"],
  drinks: ["/assets/home/category3.jpg", "Пиво в ассортименте"],
  water: ["/assets/home/category4.jpg", "Вода в ассортименте"],
} as const;
