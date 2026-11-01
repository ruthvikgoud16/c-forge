import { afterAll, describe, expect, it } from "vitest";
import { spawn, type ChildProcess } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import postgres from "postgres";
import { loadEnvLocal } from "../scripts/load-env-local.mjs";
import { packageForTopic } from "@/lib/content/registry";
import { loadLesson } from "@/lib/curriculum/catalog";
import { officialRollNumbers } from "@/lib/roster/rolls";

const VERIFY_DB = "cforge_restore_verify_20261031t113808z";
const ORIGIN_DB = "cforge";
const PORT = 3012;
const BASE = `http://127.0.0.1:${PORT}`;
const LESSON = "u1-t1-computers-and-binary";
const ASSESSMENT = "topic:u1-t1";

loadEnvLocal();

function rewriteDb(url: string, database: string) {
  const parsed = new URL(url);
  parsed.pathname = `/${database}`;
  return parsed.toString();
}

function cookieFrom(res: Response) {
  const multi = res.headers.getSetCookie?.() ?? [];
  if (multi.length) return multi.map((part) => part.split(";")[0]).join("; ");
  const single = res.headers.get("set-cookie");
  return single ? single.split(";")[0] : "";
}

async function waitReady(timeoutMs = 90_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${BASE}/api/v1/ready`);
      if (res.ok) return (await res.json()) as { storage?: string; database?: string };
    } catch {
      /* starting */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error("application did not become ready");
}

async function startApp(databaseUrl: string) {
  const nextBin = existsSync("node_modules/next/dist/bin/next")
    ? "node_modules/next/dist/bin/next"
    : "node_modules/.bin/next";
  const child = spawn(process.execPath, [nextBin, "dev", "--hostname", "127.0.0.1", `--port=${PORT}`], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      ALLOW_MEMORY_LEARNING: "",
      NODE_ENV: "development",
      PORT: String(PORT),
      ALLOW_DEV_INVITE: "0",
      FACULTY_TOKEN: "persist-verify-faculty",
      SESSION_SECRET: "persist-verify-session-secret-not-for-production",
    },
    stdio: ["ignore", "pipe", "pipe"],
  }) as ChildProcess & { logs?: string[] };
  child.logs = [];
  const take = (buf: Buffer) => {
    const text = buf.toString("utf8").replace(/postgres:\/\/\S+/g, "[redacted]");
    child.logs!.push(text);
  };
  child.stdout?.on("data", take);
  child.stderr?.on("data", take);
  const ready = await waitReady();
  if (ready.database === ORIGIN_DB) {
    child.kill("SIGTERM");
    throw new Error("application connected to original cforge; stopped");
  }
  if (ready.database !== VERIFY_DB || ready.storage !== "postgres") {
    child.kill("SIGTERM");
    throw new Error("application is not using the verification postgres database");
  }
  return child;
}

async function stopApp(child: ChildProcess) {
  if (!child.pid) return;
  child.kill("SIGTERM");
  await new Promise<void>((resolve) => {
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      resolve();
    }, 8_000);
    child.once("exit", () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

describe("application persistence across logout and restart", () => {
  const originUrl = process.env.DATABASE_URL;
  const skip = !originUrl;
  const verifyUrl = originUrl ? rewriteDb(originUrl, VERIFY_DB) : "";
  let verifySql: ReturnType<typeof postgres> | null = null;
  let originSql: ReturnType<typeof postgres> | null = null;
  let child: ChildProcess | null = null;

  afterAll(async () => {
    if (child) await stopApp(child);
    await verifySql?.end({ timeout: 5 });
    await originSql?.end({ timeout: 5 });
  });

  it(
    "stores lesson and assessment evidence in the verify database and restores it after restart",
    async () => {
      if (skip) {
        console.warn("SKIP persistence restart: DATABASE_URL unset");
        return;
      }

      verifySql = postgres(verifyUrl, { max: 1, onnotice: () => undefined });
      originSql = postgres(originUrl, { max: 1, onnotice: () => undefined });

      const verifyId = await verifySql`SELECT current_database() AS db`;
      const originId = await originSql`SELECT current_database() AS db`;
      expect(verifyId[0]?.db).toBe(VERIFY_DB);
      expect(originId[0]?.db).toBe(ORIGIN_DB);
      expect(VERIFY_DB).not.toBe(ORIGIN_DB);

      const originBefore = await originSql`
        SELECT
          (SELECT count(*)::int FROM students) AS students,
          (SELECT count(*)::int FROM invitations) AS invitations,
          (SELECT count(*)::int FROM learning_events) AS events,
          (SELECT count(*)::int FROM practice_assessment_attempts) AS attempts
      `;

      const taken = new Set(
        (await verifySql`SELECT roll_identifier FROM students`).map((row) => String(row.roll_identifier)),
      );
      const free = officialRollNumbers().filter((roll) => !taken.has(roll));
      expect(free.length).toBeGreaterThanOrEqual(2);
      const rollA = free[free.length - 1];
      const rollB = free[free.length - 2];
      const password = `Pv${randomBytes(8).toString("hex")}`;
      child = await startApp(verifyUrl);

      const minted = await fetch(`${BASE}/api/v1/faculty/invitations`, {
        method: "POST",
        headers: { authorization: "Bearer persist-verify-faculty", "content-type": "application/json" },
        body: JSON.stringify({ ttlHours: 1, rollNumber: rollA }),
      });
      const mintedBody = await minted.json();
      expect(minted.status, JSON.stringify(mintedBody)).toBe(201);
      const tokenA = (mintedBody as { token: string }).token;

      const join = await fetch(`${BASE}/api/v1/auth/invite/accept`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: tokenA, rollIdentifier: rollA, password }),
      });
      const joinBody = await join.json();
      expect(join.status, JSON.stringify(joinBody)).toBe(201);
      let cookie = cookieFrom(join);
      expect(cookie).toContain("cforge_session");

      const login = await fetch(`${BASE}/api/v1/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rollIdentifier: rollA, password }),
      });
      expect(login.status).toBe(200);
      cookie = cookieFrom(login) || cookie;

      const lesson = await fetch(`${BASE}/api/v1/curriculum/lessons/${LESSON}`, { headers: { cookie } });
      const lessonJson = (await lesson.json()) as { lesson?: { id: string }; error?: string };
      expect(lesson.status, JSON.stringify(lessonJson)).toBe(200);
      expect(lessonJson.lesson?.id).toBe(LESSON);

      const expected = (loadLesson(LESSON)!.body as { trace: { answer: string } }).trace.answer;
      const check = await fetch(`${BASE}/api/v1/curriculum/lessons/${LESSON}/check`, {
        method: "POST",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ slot: "trace", value: expected }),
      });
      const checkJson = (await check.json()) as { correct?: boolean; error?: string };
      expect(check.status, JSON.stringify(checkJson)).toBe(200);
      expect(checkJson.correct).toBe(true);

      const pkg = packageForTopic("u1-t1");
      expect(pkg?.assessment.length).toBeGreaterThan(0);
      const responses: Record<string, string> = {};
      for (const item of pkg!.assessment) responses[item.id] = item.answer;
      const idem = `persist-${createHash("sha256").update(rollA).digest("hex").slice(0, 16)}`;
      const submit = await fetch(`${BASE}/api/v1/assessments/${ASSESSMENT}/submit`, {
        method: "POST",
        headers: { cookie, "content-type": "application/json", "idempotency-key": idem },
        body: JSON.stringify({ responses }),
      });
      const submitText = await submit.text();
      expect(submit.status, `${submitText}\n---\n${(child.logs ?? []).join("").slice(-2000)}`).toBe(200);
      const submitted = JSON.parse(submitText) as {
        earned?: number;
        total?: number;
        stored?: { attempt: number };
        error?: string;
      };
      expect(submitted.earned).toBe(submitted.total);
      expect(submitted.stored.attempt).toBe(1);

      const stored = await verifySql.begin(async (tx) => {
        const students = await tx`SELECT id::text, roll_identifier FROM students WHERE roll_identifier = ${rollA}`;
        await tx`SELECT set_config('cforge.student_id', ${students[0]!.id}, true)`;
        await tx.unsafe("SET LOCAL ROLE cforge_app");
        const events = await tx`SELECT kind, count(*)::int AS n FROM learning_events GROUP BY kind ORDER BY 1`;
        const attempts = await tx`SELECT attempt_no, earned, total, assessment_id FROM practice_assessment_attempts`;
        return { students, events, attempts };
      });
      expect(stored.students).toHaveLength(1);
      expect(stored.attempts).toHaveLength(1);
      expect(stored.attempts[0]?.earned).toBe(stored.attempts[0]?.total);
      expect(stored.events.some((row) => row.kind === "lesson_opened")).toBe(true);
      expect(stored.events.some((row) => row.kind === "assessment_completed" || row.kind === "knowledge_check")).toBe(
        true,
      );

      const logout = await fetch(`${BASE}/api/v1/auth/logout`, { method: "POST", headers: { cookie } });
      expect(logout.status).toBe(200);

      await stopApp(child);
      child = null;

      child = await startApp(verifyUrl);
      const login2 = await fetch(`${BASE}/api/v1/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rollIdentifier: rollA, password }),
      });
      expect(login2.status, await login2.clone().text()).toBe(200);
      const cookie2 = cookieFrom(login2);
      const me = await fetch(`${BASE}/api/v1/auth/me`, { headers: { cookie: cookie2 } });
      expect(me.status).toBe(200);
      expect(((await me.json()) as { rollIdentifier: string }).rollIdentifier).toBe(rollA);

      const history = await fetch(`${BASE}/api/v1/assessments/${ASSESSMENT}/attempts`, {
        headers: { cookie: cookie2 },
      });
      const historyText = await history.text();
      expect(history.status, historyText).toBe(200);
      const hist = JSON.parse(historyText) as { attempts: Array<{ attempt: number; earned: number; total: number }> };
      expect(hist.attempts).toHaveLength(1);
      expect(hist.attempts[0]?.earned).toBe(hist.attempts[0]?.total);

      const reopen = await fetch(`${BASE}/api/v1/assessments/${ASSESSMENT}`, {
        headers: { cookie: cookie2 },
      });
      expect(reopen.status).toBe(200);
      const reopened = (await reopen.json()) as { attempts: unknown[] };
      expect(reopened.attempts).toHaveLength(1);

      const afterRestart = await verifySql.begin(async (tx) => {
        const id = await tx`SELECT id::text FROM students WHERE roll_identifier = ${rollA}`;
        await tx`SELECT set_config('cforge.student_id', ${id[0]!.id}, true)`;
        await tx.unsafe("SET LOCAL ROLE cforge_app");
        return tx`SELECT count(*)::int AS n FROM practice_assessment_attempts`;
      });
      expect(afterRestart[0]?.n).toBe(1);

      const mintedB = await fetch(`${BASE}/api/v1/faculty/invitations`, {
        method: "POST",
        headers: { authorization: "Bearer persist-verify-faculty", "content-type": "application/json" },
        body: JSON.stringify({ ttlHours: 1, rollNumber: rollB }),
      });
      const tokenB = ((await mintedB.json()) as { token: string }).token;
      const joinB = await fetch(`${BASE}/api/v1/auth/invite/accept`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: tokenB, rollIdentifier: rollB, password }),
      });
      expect(joinB.status).toBe(201);
      const cookieB = cookieFrom(joinB);
      const histB = await fetch(`${BASE}/api/v1/assessments/${ASSESSMENT}/attempts`, {
        headers: { cookie: cookieB },
      });
      expect(((await histB.json()) as { attempts: unknown[] }).attempts).toEqual([]);

      const originAfter = await originSql`
        SELECT
          (SELECT count(*)::int FROM students) AS students,
          (SELECT count(*)::int FROM invitations) AS invitations,
          (SELECT count(*)::int FROM learning_events) AS events,
          (SELECT count(*)::int FROM practice_assessment_attempts) AS attempts
      `;
      expect(originAfter[0]).toEqual(originBefore[0]);

      const verifyStudents = await verifySql`SELECT roll_identifier FROM students ORDER BY 1`;
      expect(verifyStudents.map((row) => String(row.roll_identifier)).sort()).toEqual(
        [...taken, rollA, rollB].sort(),
      );
    },
    180_000,
  );
});
