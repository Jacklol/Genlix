import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import { buildLegacyCmsSeed } from "./seed";
import {
  CMS_SCHEMA_VERSION,
  normalizeCmsContent,
  type CmsContent,
} from "./types";

const LOCAL_CMS_DIR = path.join(process.cwd(), ".data", "cms");
const LOCAL_CURRENT_FILE = path.join(LOCAL_CMS_DIR, "current.json");
const LOCAL_HISTORY_DIR = path.join(LOCAL_CMS_DIR, "history");
const CMS_MEDIA_BUCKET = "cms-media";
const CMS_REQUEST_TIMEOUT_MS = 10_000;

const runtimeCmsCache = globalThis as typeof globalThis & {
  __genlixCmsLastKnownSnapshot?: CmsSnapshot;
  __genlixCmsLocalCommitQueue?: Promise<void>;
};

async function withLocalCommitLock<T>(operation: () => Promise<T>): Promise<T> {
  const previous = runtimeCmsCache.__genlixCmsLocalCommitQueue ?? Promise.resolve();
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  runtimeCmsCache.__genlixCmsLocalCommitQueue = previous.then(() => gate);

  await previous;
  try {
    return await operation();
  } finally {
    release();
  }
}

export type CmsBackendMode = "supabase" | "local" | "fallback";

export type CmsSnapshot = {
  actor: string;
  checksum: string;
  content: CmsContent;
  createdAt: string;
  reason: string;
  revision: number;
};

export type CmsSnapshotResult = {
  mode: CmsBackendMode;
  snapshot: CmsSnapshot;
  warning?: string;
  writable: boolean;
};

export type CmsHistoryEntry = Omit<CmsSnapshot, "content">;

export class CmsMediaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CmsMediaValidationError";
  }
}

function snapshotMetadata(snapshot: CmsSnapshot): CmsHistoryEntry {
  return {
    actor: snapshot.actor,
    checksum: snapshot.checksum,
    createdAt: snapshot.createdAt,
    reason: snapshot.reason,
    revision: snapshot.revision,
  };
}

type SupabaseConfig = {
  secretKey: string;
  url: string;
};

class SupabaseRequestError extends Error {
  readonly code?: string;
  readonly status: number;

  constructor(status: number, detail: string, code?: string) {
    super(
      `Supabase request failed (${status})${code ? ` [${code}]` : ""}: ${detail.slice(0, 500)}`,
    );
    this.name = "SupabaseRequestError";
    this.status = status;
    this.code = code;
  }
}

type SupabaseSnapshotRow = {
  actor: string | null;
  checksum: string;
  content: unknown;
  created_at: string;
  reason: string | null;
  revision: number | string;
  schema_version?: number;
};

function getSupabaseConfig(): SupabaseConfig | null {
  const url = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL)?.replace(
    /\/$/,
    "",
  );
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !secretKey) {
    return null;
  }

  return { secretKey, url };
}

function canUseLocalStore() {
  // Serverless production filesystems are ephemeral and may have many writers.
  // Never report a local write as durable in production.
  return process.env.NODE_ENV !== "production";
}

export function getCmsBackendMode(): CmsBackendMode {
  if (getSupabaseConfig()) {
    return "supabase";
  }

  if (canUseLocalStore()) {
    return "local";
  }

  return "fallback";
}

function serializeContent(content: CmsContent) {
  return JSON.stringify(normalizeCmsContent(content));
}

export function getCmsChecksum(content: CmsContent) {
  return createHash("sha256").update(serializeContent(content)).digest("hex");
}

function createSeedSnapshot(): CmsSnapshot {
  const content = buildLegacyCmsSeed();

  return {
    actor: "system",
    checksum: getCmsChecksum(content),
    content,
    createdAt: "2026-08-31T00:00:00.000Z",
    reason: "Исходные данные сайта до подключения CMS",
    revision: 0,
  };
}

function normalizeSnapshot(row: SupabaseSnapshotRow, verifyLocalChecksum = true): CmsSnapshot {
  const content = normalizeCmsContent(row.content);
  const revision = Number(row.revision);

  if (!Number.isSafeInteger(revision) || revision < 0) {
    throw new Error("CMS returned an invalid revision");
  }

  const localChecksum = getCmsChecksum(content);
  const checksum = row.checksum || localChecksum;

  if (verifyLocalChecksum && row.checksum && row.checksum !== localChecksum) {
    throw new Error("CMS snapshot checksum mismatch");
  }

  if (!/^[0-9a-f]{64}$/.test(checksum)) {
    throw new Error("CMS returned an invalid checksum");
  }

  if (
    row.schema_version !== undefined &&
    Number(row.schema_version) !== content.schemaVersion
  ) {
    throw new Error("CMS snapshot schema metadata does not match its content");
  }

  const createdAt = new Date(row.created_at);

  if (!Number.isFinite(createdAt.getTime())) {
    throw new Error("CMS returned an invalid snapshot timestamp");
  }

  return {
    actor: row.actor ?? "system",
    checksum,
    content,
    createdAt: createdAt.toISOString(),
    reason: row.reason ?? "",
    revision,
  };
}

async function supabaseRequest<T>(
  pathname: string,
  init: RequestInit = {},
): Promise<T> {
  const config = getSupabaseConfig();

  if (!config) {
    throw new Error("Supabase is not configured");
  }

  const response = await fetch(`${config.url}${pathname}`, {
    ...init,
    cache: "no-store",
    signal: init.signal ?? AbortSignal.timeout(CMS_REQUEST_TIMEOUT_MS),
    headers: {
      Authorization: `Bearer ${config.secretKey}`,
      apikey: config.secretKey,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    let code: string | undefined;

    try {
      const parsed = JSON.parse(detail) as { code?: unknown };
      code = typeof parsed.code === "string" ? parsed.code : undefined;
    } catch {
      // Preserve non-JSON PostgREST errors verbatim in the safe truncated detail.
    }

    throw new SupabaseRequestError(response.status, detail, code);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function loadRemoteSnapshot(): Promise<CmsSnapshot | null> {
  const rows = await supabaseRequest<SupabaseSnapshotRow[]>(
    "/rest/v1/cms_current_snapshot?select=revision,schema_version,content,checksum,created_at,actor,reason&limit=1",
  );

  return rows[0] ? verifyRemoteSnapshot(rows[0]) : null;
}

async function getRemoteChecksum(content: CmsContent) {
  const checksum = await supabaseRequest<string>(
    "/rest/v1/rpc/cms_calculate_checksum",
    {
      body: JSON.stringify({ content }),
      method: "POST",
    },
  );

  if (typeof checksum !== "string" || !/^[0-9a-f]{64}$/.test(checksum)) {
    throw new Error("Supabase returned an invalid CMS checksum");
  }

  return checksum;
}

async function verifyRemoteSnapshot(row: SupabaseSnapshotRow) {
  const snapshot = normalizeSnapshot(row, false);
  const canonicalChecksum = await getRemoteChecksum(snapshot.content);

  if (snapshot.checksum !== canonicalChecksum) {
    throw new Error("CMS remote snapshot checksum mismatch");
  }

  if (row.schema_version !== CMS_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported CMS schema version ${String(row.schema_version)}; expected ${CMS_SCHEMA_VERSION}`,
    );
  }

  return snapshot;
}

async function readLocalSnapshotFile(filename: string) {
  const source = await readFile(filename, "utf8");
  const parsed = JSON.parse(source) as SupabaseSnapshotRow;
  return normalizeSnapshot(parsed);
}

function localSnapshotDocument(snapshot: CmsSnapshot): SupabaseSnapshotRow {
  return {
    actor: snapshot.actor,
    checksum: snapshot.checksum,
    content: snapshot.content,
    created_at: snapshot.createdAt,
    reason: snapshot.reason,
    revision: snapshot.revision,
    schema_version: snapshot.content.schemaVersion,
  };
}

async function writeLocalCurrentPointer(snapshot: CmsSnapshot, document?: string) {
  await mkdir(LOCAL_CMS_DIR, { recursive: true });
  const serialized =
    document ?? `${JSON.stringify(localSnapshotDocument(snapshot), null, 2)}\n`;
  const currentTemp = `${LOCAL_CURRENT_FILE}.${randomUUID()}.tmp`;

  await writeFile(currentTemp, serialized, "utf8");
  await rename(currentTemp, LOCAL_CURRENT_FILE);
}

async function writeLocalSnapshot(snapshot: CmsSnapshot) {
  await mkdir(LOCAL_HISTORY_DIR, { recursive: true });
  const document = `${JSON.stringify(localSnapshotDocument(snapshot), null, 2)}\n`;
  const revisionName = `${String(snapshot.revision).padStart(10, "0")}.json`;
  const historyFile = path.join(LOCAL_HISTORY_DIR, revisionName);

  await writeFile(historyFile, document, { encoding: "utf8", flag: "wx" });
  await writeLocalCurrentPointer(snapshot, document);
}

async function findLatestValidLocalHistory() {
  let filenames: string[];

  try {
    filenames = (await readdir(LOCAL_HISTORY_DIR))
      .filter((filename) => /^\d+\.json$/.test(filename))
      .sort()
      .reverse();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }

  for (const filename of filenames) {
    try {
      return await readLocalSnapshotFile(path.join(LOCAL_HISTORY_DIR, filename));
    } catch (error) {
      console.error(`Ignoring invalid local CMS history file ${filename}`, error);
    }
  }

  return null;
}

async function loadLocalSnapshot(): Promise<CmsSnapshot> {
  let current: CmsSnapshot | null = null;
  let currentError: unknown;

  try {
    current = await readLocalSnapshotFile(LOCAL_CURRENT_FILE);
  } catch (error) {
    currentError = error;
  }

  const latestHistory = await findLatestValidLocalHistory();

  if (latestHistory && (!current || latestHistory.revision > current.revision)) {
    // Recovery for a crash after immutable history was written but before the
    // active pointer was renamed. The committed revision is never overwritten.
    await writeLocalCurrentPointer(latestHistory);
    return latestHistory;
  }

  if (current) {
    return current;
  }

  if (
    currentError &&
    (currentError as NodeJS.ErrnoException).code !== "ENOENT" &&
    !latestHistory
  ) {
    throw currentError;
  }

  const seed = createSeedSnapshot();
  const initialized = {
    ...seed,
    createdAt: new Date().toISOString(),
    reason: "Автоматическое создание локальной CMS из исходных данных",
    revision: 1,
  } satisfies CmsSnapshot;

  try {
    await writeLocalSnapshot(initialized);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") {
      const concurrentlyInitialized = await findLatestValidLocalHistory();

      if (concurrentlyInitialized) {
        await writeLocalCurrentPointer(concurrentlyInitialized);
        return concurrentlyInitialized;
      }
    }

    throw error;
  }

  return initialized;
}

export async function loadCmsSnapshot(): Promise<CmsSnapshotResult> {
  const mode = getCmsBackendMode();

  if (mode === "supabase") {
    try {
      const snapshot = await loadRemoteSnapshot();

      if (snapshot) {
        if (
          snapshot.revision === 0 &&
          snapshot.content.products.length === 0 &&
          snapshot.content.news.length === 0
        ) {
          return {
            mode: "fallback",
            snapshot: createSeedSnapshot(),
            warning: "База подготовлена, но исходные товары и новости ещё не перенесены.",
            writable: false,
          };
        }

        runtimeCmsCache.__genlixCmsLastKnownSnapshot = snapshot;
        return { mode, snapshot, writable: true };
      }

      return {
        mode: "fallback",
        snapshot: createSeedSnapshot(),
        warning: "Таблицы CMS созданы, но исходные данные ещё не перенесены.",
        writable: false,
      };
    } catch (error) {
      console.error("CMS read failed", error);
      const lastKnownSnapshot = runtimeCmsCache.__genlixCmsLastKnownSnapshot;

      if (lastKnownSnapshot) {
        return {
          mode,
          snapshot: lastKnownSnapshot,
          warning:
            "База временно недоступна. Показана последняя проверенная копия; редактирование отключено.",
          writable: false,
        };
      }

      // Once a remote CMS is configured, silently replacing its data with the
      // legacy seed would make all newly published content disappear. Fail
      // visibly instead so monitoring catches the outage without falsifying data.
      throw new Error(
        "CMS database is unavailable and no last-known-good snapshot is cached",
        { cause: error },
      );
    }
  }

  if (mode === "local") {
    try {
      return { mode, snapshot: await loadLocalSnapshot(), writable: true };
    } catch (error) {
      console.error("Local CMS read failed; using the versioned source fallback", error);
      return {
        mode: "fallback",
        snapshot: createSeedSnapshot(),
        warning: "Локальная CMS недоступна. Показана исходная копия.",
        writable: false,
      };
    }
  }

  return {
    mode,
    snapshot: createSeedSnapshot(),
    warning: "Постоянное хранилище CMS не подключено.",
    writable: false,
  };
}

export async function initializeCmsStore(actor: string) {
  const mode = getCmsBackendMode();

  if (mode === "local") {
    return loadLocalSnapshot();
  }

  if (mode !== "supabase") {
    throw new Error("Постоянное хранилище CMS не настроено");
  }

  const existing = await loadRemoteSnapshot();

  if (
    existing &&
    !(
      existing.revision === 0 &&
      existing.content.products.length === 0 &&
      existing.content.news.length === 0
    )
  ) {
    return existing;
  }

  return commitCmsSnapshot(0, buildLegacyCmsSeed(), actor, "Первичный перенос данных сайта");
}

export async function commitCmsSnapshot(
  expectedRevision: number,
  content: CmsContent,
  actor: string,
  reason: string,
): Promise<CmsSnapshot> {
  const normalizedContent = normalizeCmsContent(content);
  const localChecksum = getCmsChecksum(normalizedContent);
  const mode = getCmsBackendMode();

  if (mode === "supabase") {
    const checksum = await getRemoteChecksum(normalizedContent);
    const response = await supabaseRequest<SupabaseSnapshotRow[]>(
      "/rest/v1/rpc/cms_commit_snapshot",
      {
        body: JSON.stringify({
          p_actor: actor,
          p_checksum: checksum,
          p_content: normalizedContent,
          p_expected_revision: expectedRevision,
          p_reason: reason,
        }),
        method: "POST",
      },
    );
    const row = Array.isArray(response) ? response[0] : response;

    if (!row) {
      throw new Error("CMS commit returned no snapshot");
    }

    const snapshot = normalizeSnapshot(row, false);

    if (snapshot.checksum !== checksum) {
      throw new Error("CMS commit response checksum mismatch");
    }

    runtimeCmsCache.__genlixCmsLastKnownSnapshot = snapshot;
    return snapshot;
  }

  if (mode === "local") {
    return withLocalCommitLock(async () => {
      const current = await loadLocalSnapshot();

      if (current.revision !== expectedRevision) {
        throw new Error(
          `revision_conflict: expected ${expectedRevision}, current ${current.revision}`,
        );
      }

      const snapshot: CmsSnapshot = {
        actor,
        checksum: localChecksum,
        content: normalizedContent,
        createdAt: new Date().toISOString(),
        reason,
        revision: current.revision + 1,
      };
      await writeLocalSnapshot(snapshot);
      return snapshot;
    });
  }

  throw new Error("CMS is read-only until persistent storage is configured");
}

export async function mutateCmsContent(
  expectedRevision: number,
  actor: string,
  reason: string,
  mutate: (content: CmsContent) => void,
) {
  const loaded = await loadCmsSnapshot();

  if (!loaded.writable) {
    throw new Error(loaded.warning ?? "CMS is not writable");
  }

  if (loaded.snapshot.revision !== expectedRevision) {
    throw new Error(
      `revision_conflict: expected ${expectedRevision}, current ${loaded.snapshot.revision}`,
    );
  }

  const nextContent = structuredClone(loaded.snapshot.content);
  mutate(nextContent);

  return commitCmsSnapshot(expectedRevision, nextContent, actor, reason);
}

export async function listCmsHistory(limit = 30): Promise<CmsHistoryEntry[]> {
  const mode = getCmsBackendMode();

  if (mode === "supabase") {
    const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 100);
    const rows = await supabaseRequest<SupabaseSnapshotRow[]>(
      `/rest/v1/cms_snapshots?select=revision,schema_version,checksum,created_at,actor,reason&order=revision.desc&limit=${safeLimit}`,
    );

    return rows.map((row) => ({
      actor: row.actor ?? "system",
      checksum: row.checksum,
      createdAt: new Date(row.created_at).toISOString(),
      reason: row.reason ?? "",
      revision: Number(row.revision),
    }));
  }

  if (mode === "local") {
    await loadLocalSnapshot();
    const files = (await readdir(LOCAL_HISTORY_DIR))
      .filter((filename) => /^\d+\.json$/.test(filename))
      .sort()
      .reverse()
      .slice(0, limit);

    return Promise.all(
      files.map(async (filename) => {
        const snapshot = await readLocalSnapshotFile(path.join(LOCAL_HISTORY_DIR, filename));
        return snapshotMetadata(snapshot);
      }),
    );
  }

  const seed = createSeedSnapshot();
  return [snapshotMetadata(seed)];
}

export async function getCmsSnapshotByRevision(revision: number) {
  const mode = getCmsBackendMode();

  if (mode === "supabase") {
    const rows = await supabaseRequest<SupabaseSnapshotRow[]>(
      `/rest/v1/cms_snapshots?select=revision,schema_version,content,checksum,created_at,actor,reason&revision=eq.${revision}&limit=1`,
    );
    return rows[0] ? verifyRemoteSnapshot(rows[0]) : null;
  }

  if (mode === "local") {
    try {
      return await readLocalSnapshotFile(
        path.join(LOCAL_HISTORY_DIR, `${String(revision).padStart(10, "0")}.json`),
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return null;
      }
      throw error;
    }
  }

  return revision === 0 ? createSeedSnapshot() : null;
}

const mediaTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

type ImageDimensions = { height: number; width: number };

function readJpegDimensions(bytes: Buffer): ImageDimensions | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return null;
  }

  let offset = 2;
  const startOfFrameMarkers = new Set([
    0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
  ]);

  while (offset + 4 <= bytes.length) {
    while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
    const marker = bytes[offset];
    offset += 1;

    if (marker === 0xd8 || marker === 0xd9) continue;
    if (offset + 2 > bytes.length) return null;

    const segmentLength = bytes.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > bytes.length) return null;

    if (startOfFrameMarkers.has(marker)) {
      if (segmentLength < 7) return null;
      return {
        height: bytes.readUInt16BE(offset + 3),
        width: bytes.readUInt16BE(offset + 5),
      };
    }

    offset += segmentLength;
  }

  return null;
}

function readPngDimensions(bytes: Buffer): ImageDimensions | null {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  if (bytes.length < 24 || !bytes.subarray(0, 8).equals(signature)) {
    return null;
  }

  return { height: bytes.readUInt32BE(20), width: bytes.readUInt32BE(16) };
}

function readWebpDimensions(bytes: Buffer): ImageDimensions | null {
  if (
    bytes.length < 30 ||
    bytes.subarray(0, 4).toString("ascii") !== "RIFF" ||
    bytes.subarray(8, 12).toString("ascii") !== "WEBP"
  ) {
    return null;
  }

  const chunk = bytes.subarray(12, 16).toString("ascii");

  if (chunk === "VP8X") {
    return {
      width: 1 + bytes.readUIntLE(24, 3),
      height: 1 + bytes.readUIntLE(27, 3),
    };
  }

  if (chunk === "VP8 " && bytes.length >= 30) {
    if (bytes[23] !== 0x9d || bytes[24] !== 0x01 || bytes[25] !== 0x2a) return null;
    return {
      width: bytes.readUInt16LE(26) & 0x3fff,
      height: bytes.readUInt16LE(28) & 0x3fff,
    };
  }

  if (chunk === "VP8L" && bytes.length >= 25 && bytes[20] === 0x2f) {
    const bits = bytes.readUInt32LE(21);
    return {
      width: 1 + (bits & 0x3fff),
      height: 1 + ((bits >>> 14) & 0x3fff),
    };
  }

  return null;
}

function validateImageBytes(mimeType: string, bytes: Buffer) {
  const dimensions =
    mimeType === "image/jpeg"
      ? readJpegDimensions(bytes)
      : mimeType === "image/png"
        ? readPngDimensions(bytes)
        : mimeType === "image/webp"
          ? readWebpDimensions(bytes)
          : null;

  if (!dimensions) {
    throw new CmsMediaValidationError(
      "Файл повреждён или его содержимое не соответствует формату изображения",
    );
  }

  if (
    dimensions.width <= 0 ||
    dimensions.height <= 0 ||
    dimensions.width > 8_000 ||
    dimensions.height > 8_000 ||
    dimensions.width * dimensions.height > 25_000_000
  ) {
    throw new CmsMediaValidationError("Изображение имеет слишком большое разрешение");
  }

  return dimensions;
}

export async function uploadCmsImage(file: File, actor: string) {
  const extension = mediaTypes.get(file.type);

  if (!extension) {
    throw new CmsMediaValidationError("Разрешены только JPEG, PNG и WebP");
  }

  if (file.size <= 0 || file.size > 3 * 1024 * 1024) {
    throw new CmsMediaValidationError("Размер изображения должен быть не более 3 МБ");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const dimensions = validateImageBytes(file.type, bytes);
  const checksum = createHash("sha256").update(bytes).digest("hex");
  const objectPath = `uploads/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extension}`;
  const mode = getCmsBackendMode();

  if (mode === "supabase") {
    const config = getSupabaseConfig();

    if (!config) {
      throw new Error("Supabase is not configured");
    }

    const response = await fetch(
      `${config.url}/storage/v1/object/${CMS_MEDIA_BUCKET}/${objectPath}`,
      {
        body: bytes,
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${config.secretKey}`,
          apikey: config.secretKey,
          "Content-Type": file.type,
          "x-upsert": "false",
        },
        method: "POST",
        signal: AbortSignal.timeout(CMS_REQUEST_TIMEOUT_MS),
      },
    );

    if (!response.ok) {
      throw new Error(`Не удалось загрузить изображение: ${(await response.text()).slice(0, 300)}`);
    }

    const publicUrl = `${config.url}/storage/v1/object/public/${CMS_MEDIA_BUCKET}/${objectPath}`;

    await supabaseRequest<unknown>("/rest/v1/media_assets", {
      body: JSON.stringify({
        actor,
        bucket_id: CMS_MEDIA_BUCKET,
        byte_size: bytes.length,
        checksum,
        height: dimensions.height,
        mime_type: file.type,
        object_path: objectPath,
        original_filename: file.name.slice(0, 500) || null,
        width: dimensions.width,
      }),
      headers: { Prefer: "return=minimal" },
      method: "POST",
    });

    return publicUrl;
  }

  if (mode === "local") {
    const publicRoot = path.join(process.cwd(), "public", "uploads", "cms");
    const outputPath = path.join(publicRoot, objectPath);
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, bytes, { flag: "wx" });
    return `/uploads/cms/${objectPath}`;
  }

  throw new Error("Загрузка изображений недоступна без постоянного хранилища");
}
