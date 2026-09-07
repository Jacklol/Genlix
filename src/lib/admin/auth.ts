import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_COOKIE = "genlix_admin_session";
const SESSION_LIFETIME_SECONDS = 60 * 60 * 8;
const DEVELOPMENT_SESSION_SECRET =
  "genlix-development-session-secret-change-before-production";

type AdminSessionPayload = {
  credentialVersion: string;
  expiresAt: number;
  issuedAt: number;
  nonce: string;
  username: string;
};

type LoginThrottleBucket = {
  blockedUntil: number;
  failures: number;
  windowStartedAt: number;
};

const LOGIN_THROTTLE_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_THROTTLE_BLOCK_MS = 60 * 1000;
const LOGIN_THROTTLE_USER_FAILURES = 5;
const LOGIN_THROTTLE_GLOBAL_FAILURES = 40;
const LOGIN_THROTTLE_MAX_USERS = 500;
const LOGIN_THROTTLE_GLOBAL_KEY = Symbol("global-login-throttle");

type LoginThrottleKey = string | typeof LOGIN_THROTTLE_GLOBAL_KEY;

/**
 * Best-effort protection for development and single-process self-hosting only.
 * Serverless instances do not share this state; production still needs an edge
 * or distributed rate limiter in front of the login action.
 */
const loginThrottleBuckets = new Map<LoginThrottleKey, LoginThrottleBucket>();

let insecureCredentialCache:
  | { cacheKey: string; insecure: boolean }
  | undefined;

export type AdminAuthStatus = {
  configured: boolean;
  developmentDefaults: boolean;
  message?: string;
};

function constantTimeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    timingSafeEqual(leftBuffer, leftBuffer);
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function getSessionSecret() {
  const configuredSecret = process.env.ADMIN_SESSION_SECRET?.trim();

  if (configuredSecret && configuredSecret.length >= 32) {
    return configuredSecret;
  }

  if (process.env.NODE_ENV !== "production") {
    return DEVELOPMENT_SESSION_SECRET;
  }

  return null;
}

function getCredentialConfig() {
  const developmentDefaults =
    process.env.NODE_ENV !== "production" &&
    !process.env.ADMIN_USERNAME &&
    !process.env.ADMIN_PASSWORD &&
    !process.env.ADMIN_PASSWORD_HASH;
  const username = process.env.ADMIN_USERNAME?.trim() || (developmentDefaults ? "admin" : "");
  const password = process.env.ADMIN_PASSWORD ?? (developmentDefaults ? "admin" : "");
  const passwordHash = process.env.ADMIN_PASSWORD_HASH?.trim() ?? "";

  return { developmentDefaults, password, passwordHash, username };
}

type CredentialConfig = ReturnType<typeof getCredentialConfig>;

function getEffectiveCredentialMaterial(credentials: CredentialConfig) {
  return credentials.passwordHash
    ? `scrypt-hash:${credentials.passwordHash}`
    : `plain-password:${credentials.password}`;
}

function getCredentialVersion(secret: string, credentials: CredentialConfig) {
  return createHmac("sha256", secret)
    .update("genlix-admin-credential-version\0")
    .update(credentials.username)
    .update("\0")
    .update(getEffectiveCredentialMaterial(credentials))
    .digest("base64url");
}

function isInsecureAdminDefault(credentials: CredentialConfig) {
  if (credentials.username !== "admin") {
    return false;
  }

  const cacheKey = getEffectiveCredentialMaterial(credentials);

  if (insecureCredentialCache?.cacheKey === cacheKey) {
    return insecureCredentialCache.insecure;
  }

  const insecure = credentials.passwordHash
    ? verifyScryptPassword("admin", credentials.passwordHash)
    : constantTimeEqual(credentials.password, "admin");

  insecureCredentialCache = { cacheKey, insecure };
  return insecure;
}

function normalizeThrottleUsername(username: string) {
  return username.trim().toLocaleLowerCase("en-US").slice(0, 128) || "<empty>";
}

function pruneLoginThrottleBuckets(now: number) {
  for (const [key, bucket] of loginThrottleBuckets) {
    if (
      key !== LOGIN_THROTTLE_GLOBAL_KEY &&
      ((bucket.blockedUntil > 0 && bucket.blockedUntil <= now) ||
        (bucket.blockedUntil <= now &&
          now - bucket.windowStartedAt > LOGIN_THROTTLE_WINDOW_MS))
    ) {
      loginThrottleBuckets.delete(key);
    }
  }

  let userBucketCount =
    loginThrottleBuckets.size -
    Number(loginThrottleBuckets.has(LOGIN_THROTTLE_GLOBAL_KEY));

  while (userBucketCount > LOGIN_THROTTLE_MAX_USERS) {
    const oldestUserKey = [...loginThrottleBuckets.keys()].find(
      (key) => key !== LOGIN_THROTTLE_GLOBAL_KEY,
    );

    if (!oldestUserKey) {
      break;
    }

    loginThrottleBuckets.delete(oldestUserKey);
    userBucketCount -= 1;
  }
}

function getActiveThrottleBucket(key: LoginThrottleKey, now: number) {
  const bucket = loginThrottleBuckets.get(key);

  if (!bucket) {
    return null;
  }

  if (bucket.blockedUntil > now) {
    return bucket;
  }

  if (bucket.blockedUntil > 0) {
    loginThrottleBuckets.delete(key);
    return null;
  }

  if (now - bucket.windowStartedAt > LOGIN_THROTTLE_WINDOW_MS) {
    loginThrottleBuckets.delete(key);
    return null;
  }

  return bucket;
}

function isLoginThrottled(username: string, now: number) {
  pruneLoginThrottleBuckets(now);

  const userKey = normalizeThrottleUsername(username);
  const globalBucket = getActiveThrottleBucket(LOGIN_THROTTLE_GLOBAL_KEY, now);
  const userBucket = getActiveThrottleBucket(userKey, now);

  return (
    (globalBucket?.blockedUntil ?? 0) > now ||
    (userBucket?.blockedUntil ?? 0) > now
  );
}

function registerThrottleFailure(
  key: LoginThrottleKey,
  threshold: number,
  now: number,
) {
  const current = getActiveThrottleBucket(key, now) ?? {
    blockedUntil: 0,
    failures: 0,
    windowStartedAt: now,
  };
  const failures = current.failures + 1;

  loginThrottleBuckets.set(key, {
    ...current,
    blockedUntil: failures >= threshold ? now + LOGIN_THROTTLE_BLOCK_MS : 0,
    failures,
  });
}

function recordLoginFailure(username: string, now: number) {
  registerThrottleFailure(
    normalizeThrottleUsername(username),
    LOGIN_THROTTLE_USER_FAILURES,
    now,
  );
  registerThrottleFailure(
    LOGIN_THROTTLE_GLOBAL_KEY,
    LOGIN_THROTTLE_GLOBAL_FAILURES,
    now,
  );
  pruneLoginThrottleBuckets(now);
}

function recordLoginSuccess(username: string) {
  loginThrottleBuckets.delete(normalizeThrottleUsername(username));
}

export function getAdminAuthStatus(): AdminAuthStatus {
  const credentials = getCredentialConfig();
  const secret = getSessionSecret();

  if (!secret) {
    return {
      configured: false,
      developmentDefaults: false,
      message: "Задайте ADMIN_SESSION_SECRET длиной не менее 32 символов.",
    };
  }

  if (!credentials.username || (!credentials.password && !credentials.passwordHash)) {
    return {
      configured: false,
      developmentDefaults: false,
      message: "Задайте ADMIN_USERNAME и ADMIN_PASSWORD_HASH (или временный ADMIN_PASSWORD).",
    };
  }

  if (process.env.NODE_ENV === "production" && isInsecureAdminDefault(credentials)) {
    return {
      configured: false,
      developmentDefaults: false,
      message:
        "Связка admin/admin отключена в production. Установите безопасный пароль в переменных Vercel.",
    };
  }

  return {
    configured: true,
    developmentDefaults: credentials.developmentDefaults,
  };
}

function verifyScryptPassword(password: string, encodedHash: string) {
  const [scheme, salt, expectedHash] = encodedHash.split(":");

  if (scheme !== "scrypt" || !salt || !expectedHash) {
    return false;
  }

  try {
    const derived = scryptSync(password, Buffer.from(salt, "base64url"), 64);
    const expected = Buffer.from(expectedHash, "base64url");

    if (derived.length !== expected.length) {
      return false;
    }

    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export function verifyAdminCredentials(username: string, password: string) {
  const status = getAdminAuthStatus();

  if (!status.configured) {
    return false;
  }

  const now = Date.now();

  if (isLoginThrottled(username, now)) {
    return false;
  }

  const credentials = getCredentialConfig();
  const usernameMatches = constantTimeEqual(username.trim(), credentials.username);
  const passwordMatches = credentials.passwordHash
    ? verifyScryptPassword(password, credentials.passwordHash)
    : constantTimeEqual(password, credentials.password);

  if (!usernameMatches || !passwordMatches) {
    recordLoginFailure(username, now);
    return false;
  }

  recordLoginSuccess(username);
  return true;
}

export function createAdminPasswordHash(password: string) {
  const salt = randomBytes(24);
  const hash = scryptSync(password, salt, 64);
  return `scrypt:${salt.toString("base64url")}:${hash.toString("base64url")}`;
}

function signPayload(encodedPayload: string, secret: string) {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

export async function createAdminSession(username: string) {
  const secret = getSessionSecret();
  const status = getAdminAuthStatus();
  const credentials = getCredentialConfig();

  if (
    !secret ||
    !status.configured ||
    !constantTimeEqual(username.trim(), credentials.username)
  ) {
    throw new Error("Admin authentication is not configured");
  }

  const now = Math.floor(Date.now() / 1000);
  const payload: AdminSessionPayload = {
    credentialVersion: getCredentialVersion(secret, credentials),
    expiresAt: now + SESSION_LIFETIME_SECONDS,
    issuedAt: now,
    nonce: randomBytes(16).toString("base64url"),
    username: credentials.username,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signPayload(encodedPayload, secret);

  (await cookies()).set(ADMIN_COOKIE, `${encodedPayload}.${signature}`, {
    httpOnly: true,
    maxAge: SESSION_LIFETIME_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearAdminSession() {
  (await cookies()).set(ADMIN_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const secret = getSessionSecret();
  const value = (await cookies()).get(ADMIN_COOKIE)?.value;

  if (!secret || !value) {
    return null;
  }

  const status = getAdminAuthStatus();

  if (!status.configured) {
    return null;
  }

  const cookieParts = value.split(".");

  if (cookieParts.length !== 2) {
    return null;
  }

  const [encodedPayload, receivedSignature] = cookieParts;

  if (!encodedPayload || !receivedSignature) {
    return null;
  }

  const expectedSignature = signPayload(encodedPayload, secret);

  if (!constantTimeEqual(receivedSignature, expectedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as AdminSessionPayload;
    const now = Math.floor(Date.now() / 1000);
    const credentials = getCredentialConfig();
    const expectedCredentialVersion = getCredentialVersion(secret, credentials);

    if (
      typeof payload.username !== "string" ||
      typeof payload.nonce !== "string" ||
      payload.nonce.length < 16 ||
      typeof payload.credentialVersion !== "string" ||
      typeof payload.expiresAt !== "number" ||
      typeof payload.issuedAt !== "number" ||
      !Number.isSafeInteger(payload.expiresAt) ||
      !Number.isSafeInteger(payload.issuedAt) ||
      payload.expiresAt <= now ||
      payload.expiresAt <= payload.issuedAt ||
      payload.issuedAt > now + 60 ||
      payload.expiresAt - payload.issuedAt > SESSION_LIFETIME_SECONDS ||
      !constantTimeEqual(payload.username, credentials.username) ||
      !constantTimeEqual(payload.credentialVersion, expectedCredentialVersion)
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function requireAdminSession(loginPath = "/genlix-admin/login") {
  const session = await getAdminSession();

  if (!session) {
    redirect(loginPath);
  }

  return session;
}
