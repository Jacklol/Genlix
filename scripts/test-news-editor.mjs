import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { readFile, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";

const require = createRequire(import.meta.url);
const { createJiti } = createRequire(require.resolve("eslint/package.json"))("jiti");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jiti = createJiti(import.meta.url, { alias: { "@": path.join(root, "src") }, fsCache: false });
const { normalizeRichDocument, toEditorBlocks, richTextPlainText } = await jiti.import("../src/lib/rich-text.ts");
const { normalizeCmsContent, normalizeCmsImageUrl, normalizeCmsLink } = await jiti.import("../src/lib/cms/types.ts");
const { buildNewsPayloadFromForm } = await jiti.import("../src/lib/cms/forms.ts");
const { buildLegacyCmsSeed } = await jiti.import("../src/lib/cms/seed.ts");
const urls = { image: normalizeCmsImageUrl, link: normalizeCmsLink };
const text = (value, styles = {}) => ({ type: "text", text: value, styles });
const block = (id, type, content = [text("Текст")], props = {}, children = []) => ({ id, type, props, ...(content !== undefined ? { content } : {}), children });
const image = (url = "/assets/home/news_item1.jpg") => ({ id: "photo", type: "image", props: { url, name: "Фото", caption: "Подпись", showPreview: true, previewWidth: 500 }, children: [] });
const doc = (blocks = [block("p", "paragraph")]) => ({ type: "richText", version: 1, blocks });
const normalize = (value) => normalizeRichDocument(value, urls);
const seed = buildLegacyCmsSeed();

test("all old articles convert without dropping paragraphs, headings or list items", () => {
  for (const article of seed.news) {
    const before = structuredClone(article.published.content);
    const converted = toEditorBlocks(before);
    assert.deepEqual(article.published.content, before);
    assert.deepEqual(normalize(doc(converted)).blocks, converted);
    const expected = before.flatMap((b) => b.type === "list" ? b.items : [b.text]);
    for (const value of expected) assert.ok(richTextPlainText(converted).includes(value));
  }
});
test("formatting, links, nested lists, quotes, images and tables survive JSON round-trip", () => {
  const input = doc([
    block("title", "heading", [text("Заголовок")], { level: 2 }),
    block("p", "paragraph", [text("Важно", { bold: true, italic: true, underline: true, strike: true, code: true, textColor: "red", backgroundColor: "yellow" }), { type: "link", href: "https://example.com/", content: [text("Ссылка", { bold: true })] }]),
    block("list", "numberedListItem", [text("Первый")], { start: 3 }, [block("child", "bulletListItem")]),
    block("check", "checkListItem", [text("Готово")], { checked: true }),
    block("quote", "quote"), image(), { id: "line", type: "divider", props: {}, children: [] },
    block("table", "table", { type: "tableContent", columnWidths: [null, 150], headerRows: 1, rows: [{ cells: [[text("А")], [text("Б")]] }, { cells: [[text("1")], [text("2")]] }] }),
  ]);
  const result = normalize(input);
  assert.deepEqual(normalize(JSON.parse(JSON.stringify(result))), result);
  assert.equal(result.blocks[1].content[1].content[0].styles.bold, true);
  assert.equal(result.blocks[5].props.caption, "Подпись");
  assert.equal(result.blocks[7].content.rows[1].cells[0].content[0].text, "1");
});
test("CMS v1 reads unchanged; v2 is required for rich text and retains old published version", () => {
  const old = structuredClone(seed); old.schemaVersion = 1;
  assert.equal(normalizeCmsContent(old).schemaVersion, 1);
  const before = structuredClone(old.news[0].published);
  old.news[0].draft = { ...before, content: [normalize(doc())] };
  assert.throws(() => normalizeCmsContent(old), /version 2/);
  old.schemaVersion = 2;
  const restored = normalizeCmsContent(JSON.parse(JSON.stringify(old)));
  assert.deepEqual(restored.news[0].published, before);
  assert.equal(restored.news[0].draft.content[0].type, "richText");
  assert.throws(() => normalizeCmsContent({ ...old, schemaVersion: 3 }));
});
test("existing local snapshot checksum is unchanged (read-only)", async () => {
  const { createHash } = await import("node:crypto");
  let snapshot;
  try { snapshot = JSON.parse(await readFile(path.join(root, ".data/cms/current.json"), "utf8")); } catch (error) { if (error.code === "ENOENT") return; throw error; }
  const normalized = normalizeCmsContent(snapshot.content);
  assert.equal(createHash("sha256").update(JSON.stringify(normalized)).digest("hex"), snapshot.checksum);
});
test("new form accepts rich text and legacy form still works", () => {
  const payload = seed.news[0].published;
  const form = new FormData();
  for (const [name, value] of Object.entries({ ...payload, publishedAt: payload.publishedAt.slice(0, 10), content: "Старый текст" })) if (name !== "content" || typeof value === "string") form.set(name, String(value));
  assert.equal(buildNewsPayloadFromForm(form).content[0].text, "Старый текст");
  form.set("richContent", JSON.stringify(doc()));
  assert.equal(buildNewsPayloadFromForm(form).content[0].type, "richText");
  form.set("richContent", "not json");
  assert.throws(() => buildNewsPayloadFromForm(form), /прочитать/);
});
for (const href of ["javascript:alert(1)", "data:text/html,test", "http://example.com", "//evil.example", "https://user:pass@example.com"]) {
  test(`unsafe article link refused: ${href}`, () => assert.throws(() => normalize(doc([block("p", "paragraph", [{ type: "link", href, content: [text("Нажать")] }])]))));
}
for (const src of ["javascript:alert(1)", "data:image/png;base64,a", "blob:local", "https://untrusted.example/photo.jpg", ""]) {
  test(`untrusted or unfinished image refused: ${src}`, () => assert.throws(() => normalize(doc([image(src)]))));
}
test("empty content, duplicate IDs, unknown blocks/fields and deeply nested documents are refused", () => {
  assert.throws(() => normalize(doc([])));
  assert.throws(() => normalize(doc([block("p", "paragraph", [])])));
  assert.throws(() => normalize(doc([block("p", "paragraph"), block("p", "paragraph")])));
  assert.throws(() => normalize(doc([block("p", "script")])));
  assert.throws(() => normalize({ ...doc(), html: "<script>" }));
  assert.throws(() => normalize(doc([block("p", "heading", [text("Title")], { level: 1 })])));
  let nested = block("nested0", "paragraph");
  for (let i = 1; i < 10; i++) nested = block(`nested${i}`, "paragraph", [], {}, [nested]);
  assert.throws(() => normalize(doc([nested])));
});
test("incomplete and oversized tables are refused", () => {
  assert.throws(() => normalize(doc([block("t", "table", { type: "tableContent", rows: [{ cells: [[]] }, { cells: [[], []] }], columnWidths: [null] })])));
  assert.throws(() => normalize(doc([block("p", "paragraph", [text("a".repeat(100001))])])));
});
test("HTML is kept as inert text, never interpreted as markup", () => {
  const attack = "<script>alert(1)</script><img src=x onerror=alert(1)>";
  assert.equal(normalize(doc([block("p", "paragraph", [text(attack)])])).blocks[0].content[0].text, attack);
});
test("isolated store keeps draft, published version, history and optimistic locking", async () => {
  // No production environment or user CMS data can be touched by this test.
  for (const name of ["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY"]) delete process.env[name];
  process.env.NODE_ENV = "development";
  const before = process.cwd();
  const testDir = await mkdtemp(path.join(tmpdir(), "genlix-rich-store-"));
  process.chdir(testDir);
  try {
    const { loadCmsSnapshot, mutateCmsContent, listCmsHistory } = await jiti.import("../src/lib/cms/store.ts");
    const start = await loadCmsSnapshot();
    const published = structuredClone(start.snapshot.content.news[0].published);
    const saved = await mutateCmsContent(start.snapshot.revision, "test", "Draft test", (content) => {
      content.schemaVersion = 2;
      content.news[0].draft = { ...published, content: [normalize(doc([image()]))] };
    });
    assert.deepEqual(saved.content.news[0].published, published);
    const reloaded = await loadCmsSnapshot();
    assert.deepEqual(reloaded.snapshot.content.news[0].draft, saved.content.news[0].draft);
    await assert.rejects(mutateCmsContent(start.snapshot.revision, "test", "Stale", () => {}), /revision_conflict/);
    assert.equal((await listCmsHistory()).length, 2);
  } finally { process.chdir(before); }
});
