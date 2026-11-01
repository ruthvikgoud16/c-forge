import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { LIMITS, limitRequest, rateLimited, resetRateLimits, limiterSubjects } from "@/lib/security/rate-limit";
import { POST as login } from "@/app/api/v1/auth/login/route";
import { closeSql } from "@/lib/academy/db";
import { encodeSession } from "@/lib/academy/session";

beforeEach(async () => {
  resetRateLimits();
  delete process.env.DATABASE_URL;
  delete process.env.FACULTY_DATABASE_URL;
  delete process.env.CFORGE_TRUST_PROXY;
  process.env.NODE_ENV = "test";
  await closeSql();
});

afterEach(async () => {
  delete process.env.CFORGE_TRUST_PROXY;
  await closeSql();
});

function loginReq(ip: string, roll = "26EG104G01") {
  return new Request("http://127.0.0.1/api/v1/auth/login", {
    method: "POST",
    headers: { "x-forwarded-for": ip, "content-type": "application/json" },
    body: JSON.stringify({ rollIdentifier: roll, password: "password1234" }),
  });
}

describe("in-process rate limits", () => {
  it("rejects the next login after the window is full", async () => {
    for (let i = 0; i < LIMITS.login.max; i += 1) {
      expect((await limitRequest(loginReq("203.0.113.9"), "login", { subject: "26EG104G01" })).ok).toBe(true);
    }
    const blocked = await limitRequest(loginReq("203.0.113.9"), "login", { subject: "26EG104G01" });
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it("returns 429 from the login route after the limit", async () => {
    for (let i = 0; i < LIMITS.login.max; i += 1) {
      await login(loginReq("198.51.100.7"));
    }
    const response = await login(loginReq("198.51.100.7"));
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBeTruthy();
    expect(await response.json()).toMatchObject({ error: "rate_limited" });
  });

  it("ignores spoofed forwarding headers unless the proxy is trusted", async () => {
    process.env.RATE_LIMIT_LOGIN_MAX = "1";
    process.env.RATE_LIMIT_LOGIN_WINDOW_MS = "60000";
    expect((await limitRequest(loginReq("203.0.113.10"), "login", { subject: "26EG104G09" })).ok).toBe(true);
    const spoofed = await limitRequest(loginReq("198.51.100.20"), "login", { subject: "26EG104G09" });
    expect(spoofed.ok).toBe(false);
    delete process.env.RATE_LIMIT_LOGIN_MAX;
    delete process.env.RATE_LIMIT_LOGIN_WINDOW_MS;
  });

  it("uses forwarding headers only when CFORGE_TRUST_PROXY=1", () => {
    const req = loginReq("203.0.113.50");
    expect(limiterSubjects(req, { subject: "26EG104G01" })).toEqual(["id:26eg104g01"]);
    process.env.CFORGE_TRUST_PROXY = "1";
    expect(limiterSubjects(req, { subject: "26EG104G01" })).toEqual(["id:26eg104g01", "net:203.0.113.50"]);
  });

  it("keeps student and faculty buckets independent", async () => {
    process.env.RATE_LIMIT_LOGIN_MAX = "1";
    process.env.RATE_LIMIT_INVITE_MINT_MAX = "1";
    process.env.RATE_LIMIT_LOGIN_WINDOW_MS = "60000";
    process.env.RATE_LIMIT_INVITE_MINT_WINDOW_MS = "60000";
    const student = new Request("http://127.0.0.1/login", {
      headers: { cookie: `cforge_session=${encodeSession("dev-only-session-secret-not-for-production-use", { studentId: "11111111-1111-4111-8111-111111111101", rollIdentifier: "26EG104G01" })}` },
    });
    const faculty = new Request("http://127.0.0.1/faculty", {
      headers: { authorization: "Bearer test-faculty-token" },
    });
    expect((await limitRequest(student, "login", { subject: "26EG104G01" })).ok).toBe(true);
    expect((await limitRequest(faculty, "inviteMint", { faculty: true })).ok).toBe(true);
    expect((await limitRequest(student, "login", { subject: "26EG104G01" })).ok).toBe(false);
    expect((await limitRequest(faculty, "inviteMint", { faculty: true })).ok).toBe(false);
    delete process.env.RATE_LIMIT_LOGIN_MAX;
    delete process.env.RATE_LIMIT_INVITE_MINT_MAX;
    delete process.env.RATE_LIMIT_LOGIN_WINDOW_MS;
    delete process.env.RATE_LIMIT_INVITE_MINT_WINDOW_MS;
  });

  it("fails closed in production when the shared store is unavailable", async () => {
    process.env.NODE_ENV = "production";
    process.env.SESSION_SECRET = "a".repeat(40);
    process.env.DATABASE_URL = "postgres://cforge_app:x@127.0.0.1:1/cforge";
    process.env.FACULTY_TOKEN = "strong-faculty-token";
    process.env.FACULTY_DATABASE_URL = "postgres://cforge_faculty:x@127.0.0.1:1/cforge";
    process.env.CFORGE_PUBLIC_ORIGIN = "https://cforge.vercel.app";
    delete process.env.JUDGE_SECRET;
    delete process.env.JUDGE_URL;
    await closeSql();
    const blocked = await limitRequest(loginReq("203.0.113.9"), "login", { subject: "26EG104G01" });
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.retryAfterSec).toBeGreaterThan(0);
    const response = rateLimited(blocked.ok ? 1 : blocked.retryAfterSec);
    expect(response.status).toBe(429);
    process.env.NODE_ENV = "test";
    delete process.env.SESSION_SECRET;
    delete process.env.DATABASE_URL;
    delete process.env.FACULTY_TOKEN;
    delete process.env.FACULTY_DATABASE_URL;
    delete process.env.CFORGE_PUBLIC_ORIGIN;
    await closeSql();
  });
});
