import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { getFacultySql, getSql, type Sql } from "@/lib/academy/db";
import { loadEnv } from "@/lib/academy/env";
import { decodeSession } from "@/lib/academy/session";

export const DEFAULT_LIMITS = {
  login: { max: 10, windowMs: 15 * 60_000 },
  inviteAccept: { max: 10, windowMs: 15 * 60_000 },
  inviteMint: { max: 20, windowMs: 15 * 60_000 },
  lessonCheck: { max: 60, windowMs: 60_000 },
  assessmentSubmit: { max: 20, windowMs: 60_000 },
  diagnosticSubmit: { max: 20, windowMs: 60_000 },
  judgeRun: { max: 20, windowMs: 60_000 },
  judgeSubmit: { max: 10, windowMs: 60_000 },
} as const;

export type RateBucket = keyof typeof DEFAULT_LIMITS;

const ENV_KEYS: Record<RateBucket, { max: string; window: string }> = {
  login: { max: "RATE_LIMIT_LOGIN_MAX", window: "RATE_LIMIT_LOGIN_WINDOW_MS" },
  inviteAccept: { max: "RATE_LIMIT_INVITE_ACCEPT_MAX", window: "RATE_LIMIT_INVITE_ACCEPT_WINDOW_MS" },
  inviteMint: { max: "RATE_LIMIT_INVITE_MINT_MAX", window: "RATE_LIMIT_INVITE_MINT_WINDOW_MS" },
  lessonCheck: { max: "RATE_LIMIT_LESSON_CHECK_MAX", window: "RATE_LIMIT_LESSON_CHECK_WINDOW_MS" },
  assessmentSubmit: { max: "RATE_LIMIT_ASSESSMENT_SUBMIT_MAX", window: "RATE_LIMIT_ASSESSMENT_SUBMIT_WINDOW_MS" },
  diagnosticSubmit: { max: "RATE_LIMIT_DIAGNOSTIC_SUBMIT_MAX", window: "RATE_LIMIT_DIAGNOSTIC_SUBMIT_WINDOW_MS" },
  judgeRun: { max: "RATE_LIMIT_JUDGE_RUN_MAX", window: "RATE_LIMIT_JUDGE_RUN_WINDOW_MS" },
  judgeSubmit: { max: "RATE_LIMIT_JUDGE_SUBMIT_MAX", window: "RATE_LIMIT_JUDGE_SUBMIT_WINDOW_MS" },
};

type MemoryBucket = { tokens: number; lastRefill: number; max: number; windowMs: number };

const g = globalThis as typeof globalThis & { __cforgeRate?: Map<string, MemoryBucket> };

function memoryStore() {
  if (!g.__cforgeRate) g.__cforgeRate = new Map();
  return g.__cforgeRate;
}

export function resetRateLimits() {
  g.__cforgeRate = new Map();
}

function envInt(name: string, fallback: number) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function getLimits() {
  const limits = {} as { [K in RateBucket]: { max: number; windowMs: number } };
  for (const bucket of Object.keys(DEFAULT_LIMITS) as RateBucket[]) {
    const def = DEFAULT_LIMITS[bucket];
    limits[bucket] = {
      max: envInt(ENV_KEYS[bucket].max, def.max),
      windowMs: envInt(ENV_KEYS[bucket].window, def.windowMs),
    };
  }
  return limits;
}

/** Defaults used by tests and docs. Runtime routes call getLimits(). */
export const LIMITS = DEFAULT_LIMITS;

export function trustProxyEnabled() {
  return process.env.CFORGE_TRUST_PROXY === "1";
}

export function trustedClientIp(request: Request) {
  if (!trustProxyEnabled()) return null;
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const real = request.headers.get("x-real-ip")?.trim();
  const ip = forwarded || real || "";
  if (!ip || ip === "local") return null;
  return ip;
}

export function clientKey(request: Request) {
  return trustedClientIp(request) ?? "direct";
}

function hmacSubject(parts: string[]) {
  const env = loadEnv();
  return createHmac("sha256", env.sessionSecret).update(parts.join("\0")).digest();
}

function sessionFromRequest(request: Request) {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(/(?:^|;\s*)cforge_session=([^;]+)/);
  if (!match?.[1]) return null;
  return decodeSession(loadEnv().sessionSecret, match[1]);
}

export function limiterSubjects(
  request: Request,
  extra?: { subject?: string; faculty?: boolean },
) {
  const subjects: string[] = [];
  const session = sessionFromRequest(request);
  if (session?.studentId) subjects.push(`student:${session.studentId}`);
  const auth = request.headers.get("authorization") ?? "";
  if (extra?.faculty || auth.startsWith("Bearer ")) {
    subjects.push(`faculty:${createHmac("sha256", loadEnv().sessionSecret).update(auth).digest("hex")}`);
  }
  if (extra?.subject?.trim()) subjects.push(`id:${extra.subject.trim().toLowerCase()}`);
  const ip = trustedClientIp(request);
  if (ip) subjects.push(`net:${ip}`);
  else if (subjects.length === 0) subjects.push("net:direct");
  return subjects;
}

function takeMemory(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const buckets = memoryStore();
  const existing = buckets.get(key);
  const elapsed = existing ? Math.max(0, now - existing.lastRefill) : 0;
  const refill = existing ? (existing.max / existing.windowMs) * elapsed : max;
  const available = Math.min(max, (existing?.tokens ?? max) + refill);
  if (available < 1) {
    const waitMs = (1 - available) * (windowMs / max);
    buckets.set(key, { tokens: available, lastRefill: now, max, windowMs });
    return { ok: false as const, retryAfterSec: Math.max(1, Math.ceil(waitMs / 1000)) };
  }
  buckets.set(key, { tokens: available - 1, lastRefill: now, max, windowMs });
  return { ok: true as const };
}

async function takeShared(sql: Sql, bucket: string, hash: Buffer, max: number, windowMs: number) {
  const rows = await sql`
    SELECT allowed, retry_after_sec
    FROM academy_rate_limit_take(${bucket}, ${hash}, ${max}, ${windowMs})
  `;
  const row = rows[0];
  if (!row) return { ok: false as const, retryAfterSec: 30 };
  if (row.allowed) return { ok: true as const };
  return { ok: false as const, retryAfterSec: Math.max(1, Number(row.retry_after_sec) || 1) };
}

function limiterSql() {
  return getSql() ?? getFacultySql();
}

export async function rateLimit(key: string, max: number, windowMs: number) {
  const env = loadEnv();
  const sql = limiterSql();
  if (sql) {
    try {
      return await takeShared(sql, "compat", hmacSubject([key]), max, windowMs);
    } catch {
      if (env.isProduction) return { ok: false as const, retryAfterSec: 30 };
      return takeMemory(key, max, windowMs);
    }
  }
  if (env.isProduction) return { ok: false as const, retryAfterSec: 30 };
  return takeMemory(key, max, windowMs);
}

export async function limitRequest(
  request: Request,
  bucket: RateBucket,
  extra?: { subject?: string; faculty?: boolean },
) {
  const env = loadEnv();
  const spec = getLimits()[bucket];
  const subjects = limiterSubjects(request, extra);
  const sql = limiterSql();

  if (env.isProduction && !sql) {
    return { ok: false as const, retryAfterSec: 30 };
  }

  let retryAfterSec = 1;
  for (const subject of subjects) {
    if (sql) {
      try {
        const result = await takeShared(sql, bucket, hmacSubject([bucket, subject]), spec.max, spec.windowMs);
        if (!result.ok) return result;
      } catch {
        if (env.isProduction) return { ok: false as const, retryAfterSec: 30 };
        const fallback = takeMemory(`${bucket}:${subject}`, spec.max, spec.windowMs);
        if (!fallback.ok) return fallback;
      }
    } else {
      const result = takeMemory(`${bucket}:${subject}`, spec.max, spec.windowMs);
      if (!result.ok) {
        retryAfterSec = result.retryAfterSec;
        return result;
      }
    }
  }
  void retryAfterSec;
  return { ok: true as const };
}

export function rateLimited(retryAfterSec: number) {
  const retry = Math.max(1, retryAfterSec);
  return NextResponse.json(
    { error: "rate_limited", retryAfterSec: retry },
    { status: 429, headers: { "Retry-After": String(retry) } },
  );
}
