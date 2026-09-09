import type { TextContentBlock } from "./text-content";

// A bounded, versioned subset of BlockNote JSON. No HTML is stored or executed.
export const RICH_TEXT_VERSION = 1 as const;
export const MAX_RICH_TEXT_BYTES = 500_000;
export const richBlockTypes = ["paragraph", "heading", "bulletListItem", "numberedListItem", "checkListItem", "quote", "image", "table", "divider"] as const;
export type RichBlockType = (typeof richBlockTypes)[number];
export type RichStyles = Partial<Record<"bold" | "italic" | "underline" | "strike" | "code", boolean> & Record<"textColor" | "backgroundColor", string>>;
export type RichText = { type: "text"; text: string; styles: RichStyles };
export type RichInline = RichText | { type: "link"; href: string; content: RichText[] };
export type RichProps = {
  textAlignment?: "left" | "center" | "right" | "justify";
  textColor?: string; backgroundColor?: string; level?: number; checked?: boolean;
  start?: number; name?: string; url?: string; caption?: string;
  showPreview?: boolean; previewWidth?: number; colspan?: number; rowspan?: number;
};
export type RichTableCell = { type: "tableCell"; props: RichProps; content: RichInline[] };
export type RichTable = {
  type: "tableContent"; columnWidths: (number | null)[]; headerRows?: number; headerCols?: number;
  rows: { cells: RichTableCell[] }[];
};
export type RichBlock = {
  id: string; type: RichBlockType; props: RichProps;
  content?: RichInline[] | RichTable; children: RichBlock[];
};
export type RichTextDocument = { type: "richText"; version: typeof RICH_TEXT_VERSION; blocks: RichBlock[] };
export type NewsEditorState = { error: string } | null;

export class RichTextValidationError extends Error {}

export const richTextColors: Record<string, string> = {
  gray: "#69717c", brown: "#91644b", red: "#ce4242", orange: "#b96410",
  yellow: "#957500", green: "#24805a", blue: "#245caa", purple: "#7952a4", pink: "#b74b80",
};
export const richBackgroundColors: Record<string, string> = {
  gray: "#f0f1f3", brown: "#f3e7df", red: "#fbe5e5", orange: "#fff0db",
  yellow: "#fff8d4", green: "#e3f3e9", blue: "#e4effd", purple: "#eee6f8", pink: "#fae5ef",
};
const colors = new Set(["default", ...Object.keys(richTextColors)]);
const commonProps = ["textColor", "backgroundColor", "textAlignment"];

function fail(message: string): never { throw new RichTextValidationError(message); }
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("Некорректная структура текста.");
  return value as Record<string, unknown>;
}
function keys(value: Record<string, unknown>, allowed: readonly string[]) {
  if (Object.keys(value).some((key) => !allowed.includes(key))) fail("Неподдерживаемое поле редактора. Обновите страницу перед редактированием.");
}
function array(value: unknown, maximum: number): unknown[] {
  if (!Array.isArray(value) || value.length > maximum) fail("Слишком много элементов в тексте статьи.");
  return value;
}
function string(value: unknown, maximum = 20_000): string {
  if (typeof value !== "string" || value.length > maximum) fail("Недопустимая длина текста статьи.");
  return value;
}
function integer(value: unknown, minimum: number, maximum: number): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < minimum || value > maximum) fail("Некорректное числовое значение в тексте.");
  return value;
}

/** URL validation is injected by the CMS so no server configuration enters the editor bundle. */
export function normalizeRichDocument(value: unknown, urls: { image: (value: unknown) => string; link: (value: unknown) => string }): RichTextDocument {
  if (new TextEncoder().encode(JSON.stringify(value)).length > MAX_RICH_TEXT_BYTES) fail("Текст слишком большой: максимум 500 КБ без изображений.");
  const doc = record(value);
  keys(doc, ["type", "version", "blocks"]);
  if (doc.type !== "richText" || doc.version !== RICH_TEXT_VERSION) fail("Неподдерживаемая версия редактора.");
  const ids = new Set<string>();
  let blockCount = 0;
  let textLength = 0;

  function props(value: unknown, allowed: string[]): RichProps {
    const input = record(value ?? {});
    keys(input, allowed);
    const result: Record<string, string | number | boolean> = {};
    for (const key of Object.keys(input).sort()) {
      const v = input[key];
      if (v === undefined) continue;
      if (key === "textColor" || key === "backgroundColor") {
        if (typeof v !== "string" || !colors.has(v)) fail("Выберите цвет из палитры редактора.");
        result[key] = v;
      } else if (key === "textAlignment") {
        if (!["left", "center", "right", "justify"].includes(String(v))) fail("Некорректное выравнивание текста.");
        result[key] = String(v);
      } else if (key === "checked" || key === "showPreview") {
        if (typeof v !== "boolean") fail("Некорректные параметры блока.");
        result[key] = v;
      } else if (key === "url") {
        if (!v) fail("Загрузите фотографию или удалите пустой блок изображения.");
        try { result[key] = urls.image(v); } catch { fail("Фото в статье: загрузите файл или используйте разрешённый адрес изображения."); }
      } else if (key === "name" || key === "caption") result[key] = string(v, 2000);
      else if (key === "level") result[key] = integer(v, 2, 3);
      else if (key === "previewWidth") {
        if (typeof v !== "number" || !Number.isFinite(v) || v < 1 || v > 4000) fail("Некорректная ширина изображения.");
        result[key] = v;
      } else result[key] = integer(v, 1, key === "start" ? 10000 : 30);
    }
    return result as RichProps;
  }

  function text(value: unknown): RichText {
    const input = record(value);
    keys(input, ["type", "text", "styles"]);
    if (input.type !== "text") fail("Неподдерживаемое форматирование ссылки.");
    const content = string(input.text);
    textLength += content.length;
    if (textLength > 100_000) fail("Текст статьи не должен превышать 100 000 символов.");
    const styleInput = record(input.styles ?? {});
    keys(styleInput, ["bold", "italic", "underline", "strike", "code", "textColor", "backgroundColor"]);
    const styles: RichStyles = {};
    for (const key of Object.keys(styleInput).sort() as (keyof RichStyles)[]) {
      const v = styleInput[key];
      if (key === "textColor" || key === "backgroundColor") {
        if (typeof v !== "string" || !colors.has(v)) fail("Выберите цвет из палитры редактора.");
        styles[key] = v;
      } else {
        if (typeof v !== "boolean") fail("Некорректное форматирование текста.");
        styles[key] = v;
      }
    }
    return { type: "text", text: content, styles };
  }
  function inline(value: unknown): RichInline[] {
    return array(value ?? [], 2000).map((item) => {
      const input = record(item);
      if (input.type === "text") return text(input);
      keys(input, ["type", "href", "content"]);
      if (input.type !== "link") fail("Неподдерживаемый элемент внутри текста.");
      let href: string;
      try { href = urls.link(input.href); } catch { return fail("Ссылка в статье: используйте HTTPS-адрес или внутренний путь сайта."); }
      return { type: "link", href, content: array(input.content, 2000).map(text) };
    });
  }
  function table(value: unknown): RichTable {
    const input = record(value);
    keys(input, ["type", "columnWidths", "headerRows", "headerCols", "rows"]);
    if (input.type !== "tableContent") fail("Некорректная таблица.");
    const rows = array(input.rows, 100).map((row) => {
      const r = record(row); keys(r, ["cells"]);
      return { cells: array(r.cells, 20).map((cell): RichTableCell => {
        if (Array.isArray(cell)) return { type: "tableCell", props: {}, content: inline(cell) };
        const c = record(cell); keys(c, ["type", "props", "content"]);
        if (c.type !== "tableCell") fail("Некорректная ячейка таблицы.");
        const p = props(c.props, [...commonProps, "colspan", "rowspan"]);
        if ((p.colspan ?? 1) !== 1 || (p.rowspan ?? 1) !== 1) fail("Объединённые ячейки пока не поддерживаются.");
        return { type: "tableCell", props: p, content: inline(c.content) };
      }) };
    });
    if (!rows.length || !rows[0].cells.length || rows.some((row) => row.cells.length !== rows[0].cells.length)) fail("Таблица должна содержать одинаковое количество столбцов в строках.");
    const columnWidths = array(input.columnWidths ?? rows[0].cells.map(() => null), 20).map((v) => {
      if (v == null) return null;
      if (typeof v !== "number" || !Number.isFinite(v) || v < 1 || v > 4000) fail("Некорректная ширина столбца таблицы.");
      return v;
    });
    if (columnWidths.length !== rows[0].cells.length) fail("Некорректная ширина таблицы.");
    return { type: "tableContent", columnWidths,
      ...(input.headerRows !== undefined ? { headerRows: integer(input.headerRows, 0, rows.length) } : {}),
      ...(input.headerCols !== undefined ? { headerCols: integer(input.headerCols, 0, rows[0].cells.length) } : {}), rows };
  }
  function blocks(value: unknown, depth = 0): RichBlock[] {
    if (depth > 6) fail("Слишком много вложенных блоков: максимум 6 уровней.");
    return array(value, 500).map((item) => {
      if (++blockCount > 500) fail("В статье может быть не более 500 блоков.");
      const b = record(item); keys(b, ["id", "type", "props", "content", "children"]);
      const id = string(b.id, 100);
      if (!/^[a-zA-Z0-9_-]+$/.test(id) || ids.has(id)) fail("Некорректный или повторяющийся идентификатор блока.");
      ids.add(id);
      if (!richBlockTypes.includes(b.type as RichBlockType)) fail("Этот вид блока пока не поддерживается в статьях.");
      const type = b.type as RichBlockType;
      const allowed = type === "image" ? ["textAlignment", "backgroundColor", "name", "url", "caption", "showPreview", "previewWidth"]
        : type === "divider" ? [] : type === "table" ? ["textColor"]
        : [...commonProps, ...(type === "heading" ? ["level"] : type === "checkListItem" ? ["checked"] : type === "numberedListItem" ? ["start"] : [])];
      const p = props(b.props, allowed);
      if (type === "image" && !p.url) fail("Загрузите фотографию или удалите пустой блок изображения.");
      const content = type === "table" ? table(b.content) : type === "image" || type === "divider" ? undefined : inline(b.content);
      if ((type === "image" || type === "divider") && b.content !== undefined) fail("Неожиданный текст в блоке изображения или разделителя.");
      return { id, type, props: p, ...(content !== undefined ? { content } : {}), children: blocks(b.children ?? [], depth + 1) };
    });
  }
  const normalized = { type: "richText" as const, version: RICH_TEXT_VERSION, blocks: blocks(doc.blocks) };
  if (!richTextHasContent(normalized.blocks)) fail("Добавьте текст статьи или фотографию.");
  return normalized;
}

export function richTextHasContent(blocks: RichBlock[]): boolean {
  return blocks.some((b) => b.type === "image" && Boolean(b.props.url)
    || inlineText(Array.isArray(b.content) ? b.content : b.content?.rows.flatMap((r) => r.cells.flatMap((c) => c.content)) ?? []).trim().length > 0
    || richTextHasContent(b.children));
}
export function inlineText(content: RichInline[]): string {
  return content.map((item) => item.type === "text" ? item.text : item.content.map((text) => text.text).join("")).join("");
}
export function richTextPlainText(blocks: RichBlock[]): string {
  return blocks.map((b) => [b.type === "image" ? b.props.caption ?? "" : inlineText(Array.isArray(b.content) ? b.content : b.content?.rows.flatMap((r) => r.cells.flatMap((c) => c.content)) ?? []), richTextPlainText(b.children)].filter(Boolean).join("\n")).join("\n\n");
}

/** Convert only in memory; old snapshots remain byte-for-byte unchanged. */
export function toEditorBlocks(content: TextContentBlock[]): RichBlock[] {
  const text = (value: string): RichInline[] => value ? [{ type: "text", text: value, styles: {} }] : [];
  return content.flatMap((block, index): RichBlock[] => {
    if (block.type === "richText") return block.blocks;
    if (block.type === "list") return block.items.map((item, i) => ({ id: `legacy-${index}-${i}`, type: "bulletListItem", props: {}, content: text(item), children: [] }));
    return [{ id: `legacy-${index}`, type: block.type, props: block.type === "heading" ? { level: 2 } : {}, content: text(block.text), children: [] }];
  });
}
