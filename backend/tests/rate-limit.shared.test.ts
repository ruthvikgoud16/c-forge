import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import postgres from "postgres";
import { loadEnvLocal } from "../scripts/load-env-local.mjs";
import { applyMigrations } from "../scripts/migrate-engine.mjs";
import { resolvePgBin } from "../scripts/pg-bin.mjs";
import { closeSql } from "@/lib/academy/db";
import { limitRequest, resetRateLimits } from "@/lib/security/rate-limit";

function rewriteDb(url: string, name: string) {
  const next = new URL(url);
  next.pathname = `/${name}`;
  return next.toString();
}

function latestDump() {
  const dir = process.env.CFORGE_BACKUP_DIR || path.join(os.homedir(), ".cforge", "backups");
  const files = readdirSync(dir)
    .filter((name) => name.endsWith(".dump"))
    .map((name) => path.join(dir, name))
    .sort();
  return files.at(-1) ?? "";
}

const restoreName = `cforge_restore_2f9_${Date.now()}`;
let admin: ReturnType<typeof postgres> | null = null;
let ready = false;
let prevDatabaseUrl = "";
let prevFacultyUrl = "";

beforeAll(async () => {
  loadEnvLocal();
  prevDatabaseUrl = process.env.DATABASE_URL ?? "";
  prevFacultyUrl = process.env.FACULTY_DATABASE_URL ?? "";
  const dump = latestDump();
  const migrator = process.env.MIGRATOR_DATABASE_URL;
  const appUrl = process.env.DATABASE_URL;
  if (!dump || !migrator || !appUrl) {
    console.warn("SKIP shared rate-limit: dump or local URLs missing");
    return;
  }
  if (restoreName === "cforge") throw new Error("refusing to restore onto cforge");

  const adminUrl =
    process.env.ADMIN_DATABASE_URL ||
    `postgres://${encodeURIComponent(os.userInfo().username)}@127.0.0.1:5432/postgres`;
  admin = postgres(adminUrl, { max: 1, onnotice: () => undefined });
  const live = await admin`SELECT 1 FROM pg_database WHERE datname = 'cforge'`;
  if (!live[0]) throw new Error("live cforge missing");
  await admin.unsafe(`CREATE DATABASE ${quoteIdent(restoreName)} OWNER cforge_owner TEMPLATE template0`);

  const env = { ...process.env };
  delete env.DATABASE_URL;
  const restored = spawnSync(
    resolvePgBin("pg_restore"),
    ["--no-password", `--dbname=${restoreName}`, "--host=127.0.0.1", "--port=5432", `--username=${os.userInfo().username}`, dump],
    { env, encoding: "utf8" },
  );
  if (restored.status !== 0) {
    await admin.unsafe(`DROP DATABASE IF EXISTS ${quoteIdent(restoreName)}`);
    throw new Error("pg_restore failed");
  }

  const report = await applyMigrations(rewriteDb(migrator, restoreName), { allowAnyTarget: true, allowNonEmpty: true });
  const applied = report.results.find((row) => row.id === "2026-10-31_014_rate_limit");
  if (!applied || (applied.status !== "applied" && applied.status !== "skipped")) {
    throw new Error("014 was not applied on the restore database");
  }

  const liveCheck = postgres(
    process.env.ADMIN_DATABASE_URL ||
      `postgres://${encodeURIComponent(os.userInfo().username)}@127.0.0.1:5432/cforge`,
    { max: 1, onnotice: () => undefined },
  );
  try {
    const n = await liveCheck`SELECT count(*)::int AS n FROM schema_migrations`;
    if (n[0]?.n !== 14) {
      throw new Error(`live cforge ledger changed: ${n[0]?.n}`);
    }
    const rate = await liveCheck`SELECT to_regclass('public.rate_limit_buckets') AS rel`;
    if (!rate[0]?.rel) {
      throw new Error("live cforge missing rate_limit_buckets after 014");
    }
  } finally {
    await liveCheck.end({ timeout: 5 });
  }

  process.env.DATABASE_URL = rewriteDb(appUrl, restoreName);
  if (prevFacultyUrl) process.env.FACULTY_DATABASE_URL = rewriteDb(prevFacultyUrl, restoreName);
  delete process.env.CFORGE_TRUST_PROXY;
  process.env.NODE_ENV = "test";
  process.env.SESSION_SECRET = process.env.SESSION_SECRET || "dev-only-session-secret-not-for-production-use";
  await closeSql();
  resetRateLimits();
  ready = true;
}, 120_000);

afterAll(async () => {
  await closeSql();
  process.env.DATABASE_URL = prevDatabaseUrl || undefined;
  process.env.FACULTY_DATABASE_URL = prevFacultyUrl || undefined;
  if (admin) {
    await admin`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = ${restoreName} AND pid <> pg_backend_pid()`;
    await admin.unsafe(`DROP DATABASE IF EXISTS ${quoteIdent(restoreName)}`);
    await admin.end({ timeout: 5 });
  }
});

function quoteIdent(name: string) {
  if (!/^cforge_restore_[a-z0-9_]+$/.test(name)) throw new Error("unsafe restore name");
  return `"${name.replaceAll('"', "")}"`;
}

function req(ip: string, roll: string) {
  return new Request("http://127.0.0.1/api/v1/auth/login", {
    method: "POST",
    headers: { "x-forwarded-for": ip, "content-type": "application/json" },
    body: JSON.stringify({ rollIdentifier: roll, password: "x" }),
  });
}

describe("shared PostgreSQL rate limits", () => {
  it("shares counters across connections and blocks concurrent surplus", async () => {
    if (!ready) return;
    process.env.RATE_LIMIT_LOGIN_MAX = "5";
    process.env.RATE_LIMIT_LOGIN_WINDOW_MS = "60000";
    const inspect = postgres(
      process.env.ADMIN_DATABASE_URL ||
        `postgres://${encodeURIComponent(os.userInfo().username)}@127.0.0.1:5432/${restoreName}`,
      { max: 1, onnotice: () => undefined },
    );
    try {
      await inspect`DELETE FROM rate_limit_buckets`;
    } finally {
      await inspect.end({ timeout: 5 });
    }
    await closeSql();
    const results = await Promise.all(
      Array.from({ length: 12 }, () => limitRequest(req("203.0.113.8", "26EG104G10"), "login", { subject: "26EG104G10" })),
    );
    expect(results.filter((row) => row.ok)).toHaveLength(5);
    expect(results.filter((row) => !row.ok)).toHaveLength(7);

    const extra = await limitRequest(req("203.0.113.8", "26EG104G10"), "login", { subject: "26EG104G10" });
    expect(extra.ok).toBe(false);
    delete process.env.RATE_LIMIT_LOGIN_MAX;
    delete process.env.RATE_LIMIT_LOGIN_WINDOW_MS;
  });

  it("refills after the window and keeps faculty independent of login", async () => {
    if (!ready) return;
    process.env.RATE_LIMIT_LOGIN_MAX = "1";
    process.env.RATE_LIMIT_LOGIN_WINDOW_MS = "200";
    process.env.RATE_LIMIT_INVITE_MINT_MAX = "1";
    process.env.RATE_LIMIT_INVITE_MINT_WINDOW_MS = "60000";
    const inspect = postgres(
      process.env.ADMIN_DATABASE_URL ||
        `postgres://${encodeURIComponent(os.userInfo().username)}@127.0.0.1:5432/${restoreName}`,
      { max: 1, onnotice: () => undefined },
    );
    try {
      await inspect`DELETE FROM rate_limit_buckets`;
    } finally {
      await inspect.end({ timeout: 5 });
    }
    await closeSql();
    expect((await limitRequest(req("203.0.113.1", "26EG104G11"), "login", { subject: "26EG104G11" })).ok).toBe(true);
    expect((await limitRequest(req("203.0.113.1", "26EG104G11"), "login", { subject: "26EG104G11" })).ok).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 260));
    expect((await limitRequest(req("203.0.113.1", "26EG104G11"), "login", { subject: "26EG104G11" })).ok).toBe(true);

    const faculty = new Request("http://127.0.0.1/faculty", { headers: { authorization: "Bearer test-faculty-token" } });
    expect((await limitRequest(faculty, "inviteMint", { faculty: true })).ok).toBe(true);
    expect((await limitRequest(faculty, "inviteMint", { faculty: true })).ok).toBe(false);
    expect((await limitRequest(req("203.0.113.1", "26EG104G12"), "login", { subject: "26EG104G12" })).ok).toBe(true);
    delete process.env.RATE_LIMIT_LOGIN_MAX;
    delete process.env.RATE_LIMIT_LOGIN_WINDOW_MS;
    delete process.env.RATE_LIMIT_INVITE_MINT_MAX;
    delete process.env.RATE_LIMIT_INVITE_MINT_WINDOW_MS;
  });

  it("denies runtime table access and faculty can take a token", async () => {
    if (!ready) return;
    const app = postgres(process.env.DATABASE_URL!, { max: 1, onnotice: () => undefined });
    const faculty = postgres(process.env.FACULTY_DATABASE_URL || process.env.DATABASE_URL!, { max: 1, onnotice: () => undefined });
    try {
      await expect(app`SELECT * FROM rate_limit_buckets`).rejects.toThrow(/permission denied/);
      const hash = Buffer.alloc(32, 7);
      const taken = await faculty`SELECT allowed FROM academy_rate_limit_take('inviteMint', ${hash}, 2, 60000)`;
      expect(taken[0]?.allowed).toBe(true);
    } finally {
      await app.end({ timeout: 5 });
      await faculty.end({ timeout: 5 });
    }
  });
});
