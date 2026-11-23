import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const require = createRequire(import.meta.url);
const { createJiti } = createRequire(require.resolve("eslint/package.json"))("jiti");
const jiti = createJiti(import.meta.url, { fsCache: false, alias: {
  "@": fileURLToPath(new URL("../src", import.meta.url)),
  "next/cache": fileURLToPath(new URL("./fixtures/next-cache.mjs", import.meta.url)),
} });
const { loadPublicCmsSnapshot, PUBLIC_CMS_CACHE_SECONDS } = await jiti.import("../src/lib/cms/public-cache.ts");
const { invalidatePublicCmsCache, PUBLIC_CMS_CACHE_TAG } = await jiti.import("../src/lib/cms/cache-tags.ts");
const { loadAdminCmsSnapshot } = await jiti.import("../src/lib/cms/store.ts");

function fixture(t) {
  const previous = { url: process.env.SUPABASE_URL, key: process.env.SUPABASE_SECRET_KEY, snapshot: globalThis.__genlixCmsLastKnownSnapshot };
  process.env.SUPABASE_URL = "https://public-cache-test.invalid";
  process.env.SUPABASE_SECRET_KEY = "test-key";
  delete globalThis.__genlixCmsLastKnownSnapshot;
  const cache = globalThis.__genlixTestDataCache;
  cache.entries.clear(); cache.invalidations.length = 0;
  const state = { revision: 1, requests: 0, unavailable: false, clock: 1_000_000, gate: null };
  t.mock.method(Date, "now", () => state.clock);
  t.mock.method(console, "error", () => {});
  t.mock.method(globalThis, "fetch", async input => {
    const url = new URL(input);
    assert.equal(url.origin, process.env.SUPABASE_URL);
    state.requests++;
    if (state.unavailable) throw new Error("fixture unavailable");
    const content = '{"schemaVersion":4,"products":[],"news":[]}';
    const row = { revision: state.revision, schema_version: 4, content, checksum: createHash("sha256").update(content).digest("hex"), created_at: "2026-11-24T00:00:00Z", actor: "test", reason: "fixture" };
    if (state.gate) { const gate = state.gate; state.gate = null; await gate; }
    return Response.json([url.searchParams.get("select").includes("content::text") ? row : { revision: row.revision, schema_version: 4, checksum: row.checksum }]);
  });
  t.after(() => {
    for (const [env, value] of [["SUPABASE_URL", previous.url], ["SUPABASE_SECRET_KEY", previous.key]]) {
      if (value === undefined) delete process.env[env]; else process.env[env] = value;
    }
    globalThis.__genlixCmsLastKnownSnapshot = previous.snapshot;
    cache.entries.clear();
  });
  return state;
}

test("public requests share a ten-minute cache and concurrent cold reads use one database read", async t => {
  const state = fixture(t);
  const values = await Promise.all(Array.from({ length: 5 }, () => loadPublicCmsSnapshot()));
  assert(values.every(value => value.snapshot.revision === 1));
  assert.equal(state.requests, 1);
  assert.equal(PUBLIC_CMS_CACHE_SECONDS, 600);
  state.clock += 599_999;
  await loadPublicCmsSnapshot();
  assert.equal(state.requests, 1);
});

test("publication expires the shared tag and the next visitor receives the new revision", async t => {
  const state = fixture(t);
  await loadPublicCmsSnapshot();
  state.revision = 2;
  invalidatePublicCmsCache();
  assert.deepEqual(globalThis.__genlixTestDataCache.invalidations, [{ tag: PUBLIC_CMS_CACHE_TAG, options: { expire: 0 } }]);
  assert.equal((await loadPublicCmsSnapshot()).snapshot.revision, 2);
});

test("expired cache entries cannot hide an outage, while admin reads always check the database", async t => {
  const state = fixture(t);
  await loadPublicCmsSnapshot();
  state.unavailable = true;
  assert.equal(await loadAdminCmsSnapshot(), null);
  assert.equal((await loadPublicCmsSnapshot()).snapshot.revision, 1);
  state.clock += 600_000;
  await assert.rejects(loadPublicCmsSnapshot(), /актуальный каталог/);
  state.unavailable = false;
  state.revision = 2;
  assert.equal((await loadPublicCmsSnapshot()).snapshot.revision, 2);
});

test("a read started before a publication cannot refill the cache with the previous revision", async t => {
  const state = fixture(t);
  let release;
  state.gate = new Promise(resolve => { release = resolve; });
  const loading = loadPublicCmsSnapshot();
  await new Promise(resolve => setImmediate(resolve));
  state.revision = 2;
  invalidatePublicCmsCache();
  release();
  assert.equal((await loading).snapshot.revision, 2);
  assert.equal((await loadPublicCmsSnapshot()).snapshot.revision, 2);
});
