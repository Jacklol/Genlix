import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const require = createRequire(import.meta.url);
const { createJiti } = createRequire(require.resolve("eslint/package.json"))("jiti");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jiti = createJiti(import.meta.url, { alias: { "@": path.join(root, "src") }, fsCache: false });
const { getYouTubeVideoId, normalizeYouTubeVideoUrl, getProductVideo, normalizeProductVideoUrl, MAX_PRODUCT_VIDEOS } = await jiti.import("../src/lib/catalog/product-videos.ts");
const { buildProductPayloadFromForm } = await jiti.import("../src/lib/cms/forms.ts");
const { normalizeCmsContent, CMS_SCHEMA_VERSION } = await jiti.import("../src/lib/cms/types.ts");
const { buildLegacyCmsSeed } = await jiti.import("../src/lib/cms/seed.ts");
const seed = buildLegacyCmsSeed();
const original = seed.products[0].published;
const id = "M7lc1UVf-VE";
const url = `https://www.youtube.com/watch?v=${id}`;
const second = "https://www.youtube.com/watch?v=jNQXAC9IVRw";
const mp4 = "https://media.example.com/product.mp4?token=temporary&download=1";
const webm = "https://media.example.com/product.webm";

function formFor(payload = original) {
  const form = new FormData();
  const values = {
    category: payload.category, title: payload.catalog.title, brand: payload.catalog.brand,
    image: payload.catalog.image, images: payload.detail.images.join("\n"),
    specs: payload.catalog.specs.map((spec) => `${spec.label} | ${spec.value}`).join("\n"),
    detailCategory: payload.detail.category, description: payload.detail.description,
    packagingDisplay: payload.detail.packaging, shelfLife: payload.detail.shelfLife, storage: payload.detail.storage,
    ...payload.catalog.meat, cutIds: payload.catalog.meat.cutIds.join(","), cooking: payload.catalog.meat.cooking.join(","),
  };
  for (const [key, value] of Object.entries(values)) form.set(key, String(value));
  return form;
}

function snapshotWithVideos(videos) {
  const copy = structuredClone(seed);
  copy.products[0].draft = { ...structuredClone(original), detail: { ...structuredClone(original.detail), videos } };
  return copy;
}

test("YouTube watch, share, Shorts, live and embed URLs normalize to the same video", () => {
  for (const source of [url, `https://youtu.be/${id}?si=share&t=12`, `https://m.youtube.com/watch?v=${id}&list=ignored`, `https://youtube.com/shorts/${id}`, `https://www.youtube.com/live/${id}`, `https://www.youtube-nocookie.com/embed/${id}`]) {
    assert.equal(getYouTubeVideoId(source), id);
    assert.equal(normalizeYouTubeVideoUrl(source), url);
  }
});

test("non-YouTube files, unsafe URLs, credentials, lookalike hosts and invalid IDs are rejected", () => {
  for (const source of ["/video.mp4", "https://example.com/video.mp4", "javascript:alert(1)", "https://youtube.com.evil.test/watch?v=" + id, "https://youtube.com@evil.test/watch?v=" + id, "https://user:password@youtube.com/watch?v=" + id, "https://youtube.com:444/watch?v=" + id, "http://youtu.be/" + id, "https://youtube.com/playlist?list=test", "https://youtube.com/watch?v=short", "https://youtu.be/" + id + "/extra", "https://youtube.com/watch?v=" + "x".repeat(2001)]) {
    assert.equal(normalizeYouTubeVideoUrl(source), null, source);
  }
});

test("direct MP4/WebM links preserve signed query strings and choose the native player", () => {
  assert.deepEqual(getProductVideo(mp4), { type: "file", url: mp4, format: "mp4" });
  assert.deepEqual(getProductVideo(webm), { type: "file", url: webm, format: "webm" });
  assert.deepEqual(getProductVideo(`https://youtu.be/${id}?si=test`), { type: "youtube", url, id });
  assert.equal(normalizeProductVideoUrl("  https://MEDIA.example.com/product.MP4  "), "https://media.example.com/product.MP4");
});

test("direct links reject scripts, non-HTTPS sources, credentials and non-video pages", () => {
  for (const source of ["/product.mp4", "http://media.example.com/product.mp4", "javascript:alert(1)", "data:video/mp4;base64,test", "https://user:password@media.example.com/product.mp4", "https://media.example.com:444/product.mp4", "https://media.example.com/page?file=product.mp4", "https://media.example.com/product.mp4.html", "https://media.example.com/product.mov", `${mp4}&long=${"x".repeat(2_001)}`]) {
    assert.equal(normalizeProductVideoUrl(source), null, source);
  }
});

test("admin input preserves order, removes duplicates and leaves photos and descriptions intact", () => {
  const form = formFor();
  form.set("videos", `https://youtu.be/${id}\r\n\n${mp4}\n${second}\n${url}\n${webm}\n${mp4}`);
  const payload = buildProductPayloadFromForm(form, original);
  assert.deepEqual(payload.detail.videos, [url, mp4, second, webm]);
  assert.deepEqual(payload.detail.images, original.detail.images);
  assert.equal(payload.detail.description, original.detail.description);
  const snapshot = snapshotWithVideos(payload.detail.videos);
  assert.deepEqual(normalizeCmsContent(JSON.parse(JSON.stringify(snapshot))).products[0].draft.detail.videos, [url, mp4, second, webm]);
});

test("older forms retain videos; explicitly empty admin input removes them", () => {
  const payload = { ...original, detail: { ...original.detail, videos: [url, mp4, webm] } };
  const form = formFor(payload);
  assert.deepEqual(buildProductPayloadFromForm(form, payload).detail.videos, [url, mp4, webm]);
  form.set("videos", " \n ");
  assert.equal("videos" in buildProductPayloadFromForm(form, payload).detail, false);
});

test("admin and imported snapshots validate each video and enforce a bounded list", () => {
  const form = formFor();
  form.set("videos", `${url}\nhttps://example.com/video.html`);
  assert.throws(() => buildProductPayloadFromForm(form, original), /Видео 2/);
  assert.throws(() => normalizeCmsContent(snapshotWithVideos(["https://example.com/video.html"])), /MP4\/WebM/);
  form.set("videos", Array(MAX_PRODUCT_VIDEOS + 1).fill(url).join("\n"));
  assert.throws(() => buildProductPayloadFromForm(form, original), /не более/);
  assert.throws(() => normalizeCmsContent(snapshotWithVideos(Array(MAX_PRODUCT_VIDEOS + 1).fill(url))), /no more/);
});

test("videos require v4; v1/v2/v3 without videos stay byte-for-byte unchanged", () => {
  assert.equal(CMS_SCHEMA_VERSION, 4);
  for (const version of [1, 2, 3]) {
    const legacy = structuredClone(seed); legacy.schemaVersion = version;
    assert.equal(JSON.stringify(normalizeCmsContent(legacy)), JSON.stringify(legacy));
    assert.throws(() => normalizeCmsContent({ ...snapshotWithVideos([url]), schemaVersion: version }), /version 4/);
  }
});

test("existing local snapshot is unchanged, including its checksum (read-only)", async () => {
  const { createHash } = await import("node:crypto");
  let snapshot;
  try { snapshot = JSON.parse(await readFile(path.join(root, ".data/cms/current.json"), "utf8")); }
  catch (error) { if (error.code === "ENOENT") return; throw error; }
  const content = normalizeCmsContent(snapshot.content);
  assert.equal(JSON.stringify(content), JSON.stringify(snapshot.content));
  assert.equal(createHash("sha256").update(JSON.stringify(content)).digest("hex"), snapshot.checksum);
});

test("isolated CMS keeps videos private in drafts, publishes them and retains historical versions", async () => {
  const userFile = path.join(root, ".data/cms/current.json");
  const userBefore = await readFile(userFile, "utf8").catch(() => null);
  for (const key of ["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY"]) delete process.env[key];
  process.env.NODE_ENV = "development";
  const testDir = await mkdtemp(path.join(tmpdir(), "genlix-video-store-"));
  const before = process.cwd(); process.chdir(testDir);
  try {
    const store = await jiti.import("../src/lib/cms/store.ts");
    const repo = await jiti.import("../src/lib/cms/repository.ts");
    const initial = await store.loadCmsSnapshot();
    const product = initial.snapshot.content.products[0];
    const saved = await store.mutateCmsContent(initial.snapshot.revision, "test", "Video draft", content => {
      content.schemaVersion = CMS_SCHEMA_VERSION;
      content.products[0].draft = { ...product.published, detail: { ...product.published.detail, videos: [url, mp4, webm] } };
    });
    assert.equal((await repo.getPublishedProductBySlug(product.slug)).videos, undefined);
    assert.deepEqual((await store.loadCmsSnapshot()).snapshot.content.products[0].draft.detail.videos, [url, mp4, webm]);
    const published = await store.mutateCmsContent(saved.revision, "test", "Publish videos", content => {
      const entity = content.products[0]; entity.published = entity.draft; delete entity.draft;
    });
    assert.deepEqual((await repo.getPublishedProductBySlug(product.slug)).videos, [url, mp4, webm]);
    assert.equal((await store.getCmsSnapshotByRevision(initial.snapshot.revision)).content.products[0].published.detail.videos, undefined);
    assert.deepEqual((await store.getCmsSnapshotByRevision(published.revision)).content.products[0].published.detail.videos, [url, mp4, webm]);
    const restored = await store.mutateCmsContent(published.revision, "test", "Restore earlier version", content => {
      content.products[0].published = product.published;
    });
    assert.equal((await repo.getPublishedProductBySlug(product.slug)).videos, undefined);
    assert.equal((await store.loadCmsSnapshot()).snapshot.revision, restored.revision);
  } finally { process.chdir(before); }
  assert.equal(await readFile(userFile, "utf8").catch(() => null), userBefore);
});
