import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const require = createRequire(import.meta.url);
const { createJiti } = createRequire(require.resolve("eslint/package.json"))("jiti");
const jiti = createJiti(import.meta.url, {
  alias: { "@": fileURLToPath(new URL("../src", import.meta.url)) },
  fsCache: false,
});
const { getCmsSnapshotByRevision, loadAdminCmsSnapshot, loadCmsSnapshot, mutateCmsContent } = await jiti.import("../src/lib/cms/store.ts");

test("Supabase reads verify the stored text and saves retain the revision check", async (t) => {
  const host = "https://cms-test.invalid";
  const previousUrl = process.env.SUPABASE_URL;
  const previousKey = process.env.SUPABASE_SECRET_KEY;
  process.env.SUPABASE_URL = host;
  process.env.SUPABASE_SECRET_KEY = "test-key";
  t.after(() => {
    if (previousUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.SUPABASE_SECRET_KEY;
    else process.env.SUPABASE_SECRET_KEY = previousKey;
  });

  // PostgREST returns the PostgreSQL text representation, not compact JS JSON.
  const raw = '{"news": [], "products": [], "schemaVersion": 4}';
  const checksum = createHash("sha256").update(raw).digest("hex");
  const row = {
    revision: 2, schema_version: 4, content: raw, checksum,
    created_at: "2026-10-15T00:00:00Z", actor: "test", reason: "fixture",
  };
  const requests = [];
  let activeRevision = 2;
  let content = raw;

  t.mock.method(globalThis, "fetch", async (input, init) => {
    const url = new URL(input);
    assert.equal(url.origin, host);
    requests.push([init.method ?? "GET", url.pathname]);
    switch (url.pathname) {
      case "/rest/v1/cms_current_snapshot":
      case "/rest/v1/cms_snapshots":
        assert.ok(url.searchParams.get("select").split(",").includes("content::text"));
        return Response.json([{ ...row, content }]);
      case "/rest/v1/rpc/cms_calculate_checksum":
        return Response.json(checksum);
      case "/rest/v1/rpc/cms_commit_snapshot": {
        const payload = JSON.parse(init.body);
        if (payload.p_expected_revision !== activeRevision) {
          return Response.json({ code: "40001", message: "revision_conflict" }, { status: 500 });
        }
        return Response.json([{ ...row, content: payload.p_content, revision: ++activeRevision }]);
      }
      default:
        assert.fail(`Unexpected request: ${url.pathname}`);
    }
  });

  const loaded = await loadCmsSnapshot();
  assert.equal(loaded.writable, true);
  assert.equal(loaded.snapshot.revision, 2);
  const committed = await mutateCmsContent(2, "test", "test", () => {}, loaded);
  assert.equal(committed.revision, 3);
  assert.deepEqual(requests, [
    ["GET", "/rest/v1/cms_current_snapshot"],
    ["POST", "/rest/v1/rpc/cms_calculate_checksum"],
    ["POST", "/rest/v1/rpc/cms_commit_snapshot"],
  ]);
  await assert.rejects(mutateCmsContent(2, "test", "stale", () => {}, loaded), /40001.*revision_conflict/);

  assert.equal((await getCmsSnapshotByRevision(2)).revision, 2);
  content = raw.replace(": 4", ": 3");
  await assert.rejects(getCmsSnapshotByRevision(2), /checksum mismatch/);
  const readError = t.mock.method(console, "error", () => {});
  const fallback = await loadCmsSnapshot();
  assert.equal(readError.mock.callCount(), 1);
  assert.equal(fallback.writable, false);
  assert.equal(fallback.snapshot.revision, committed.revision);
});

test("the admin confirms cached revisions and rejects stale data during an outage", async (t) => {
  const host = "https://cms-catalog-test.invalid";
  const previousUrl = process.env.SUPABASE_URL;
  const previousKey = process.env.SUPABASE_SECRET_KEY;
  const previousSnapshot = globalThis.__genlixCmsLastKnownSnapshot;
  process.env.SUPABASE_URL = host;
  process.env.SUPABASE_SECRET_KEY = "test-key";
  delete globalThis.__genlixCmsLastKnownSnapshot;
  t.after(() => {
    if (previousUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.SUPABASE_SECRET_KEY;
    else process.env.SUPABASE_SECRET_KEY = previousKey;
    globalThis.__genlixCmsLastKnownSnapshot = previousSnapshot;
  });

  const content = '{"news": [], "products": [], "schemaVersion": 4}';
  const checksum = createHash("sha256").update(content).digest("hex");
  let revision = 10;
  let unavailable = false;
  const reads = [];

  t.mock.method(globalThis, "fetch", async (input) => {
    const url = new URL(input);
    assert.equal(url.origin, host);
    assert.equal(url.pathname, "/rest/v1/cms_current_snapshot");
    const full = url.searchParams.get("select").includes("content::text");
    reads.push(full ? "snapshot" : "revision");
    if (unavailable) return new Response(null, { status: 503 });
    const metadata = { revision, schema_version: 4, checksum };
    return Response.json([full ? {
      ...metadata, content, created_at: "2026-10-15T00:00:00Z", actor: "test", reason: "fixture",
    } : metadata]);
  });

  assert.equal((await loadAdminCmsSnapshot()).snapshot.revision, 10);
  assert.equal((await loadAdminCmsSnapshot()).writable, true);
  assert.deepEqual(reads.splice(0), ["snapshot", "revision"]);

  revision++;
  assert.equal((await loadAdminCmsSnapshot()).snapshot.revision, 11);
  assert.deepEqual(reads.splice(0), ["revision", "snapshot"]);

  unavailable = true;
  t.mock.method(console, "error", () => {});
  assert.equal(await loadAdminCmsSnapshot(), null);
  assert.deepEqual(reads.splice(0), ["revision"]);

  unavailable = false;
  assert.equal((await loadAdminCmsSnapshot()).writable, true);
  assert.deepEqual(reads, ["revision"]);
});
