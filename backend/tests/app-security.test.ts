import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as getMe } from "@/app/api/v1/auth/me/route";
import { POST as login } from "@/app/api/v1/auth/login/route";
import { POST as acceptInvite } from "@/app/api/v1/auth/invite/accept/route";
import { POST as postProgress } from "@/app/api/v1/progress/route";
import { GET as getReady } from "@/app/api/v1/ready/route";
import { GET as getDiagnostic } from "@/app/api/v1/diagnostics/[id]/route";
import { GET as getFacultyOverview } from "@/app/api/v1/faculty/overview/route";
import { GET as getFacultyLabs } from "@/app/api/v1/faculty/labs/route";
import { POST as postFacultyInvite } from "@/app/api/v1/faculty/invitations/route";
import { closeSql } from "@/lib/academy/db";
import { encodeSession, decodeSession } from "@/lib/academy/session";
import { signPayload } from "@/lib/academy/crypto";
import { mintInvitation, loginStudent } from "@/lib/academy/onboard";
import { resetStore } from "@/lib/academy/store";
import { resetRoster, seedRoster } from "@/lib/roster/store";
import { resetLearningStore } from "@/lib/learning/store";
import { startDiagnostic } from "@/lib/learning/diagnostics";
import { facultyAuthorized } from "@/lib/faculty/auth";
import { json, readJsonBody, rejectCrossOrigin } from "@/lib/academy/http";

const SECRET = "dev-only-session-secret-not-for-production-use";
const FACULTY = "test-faculty-token-appsec";
const STUDENT_A = "11111111-1111-4111-8111-111111111101";
const STUDENT_B = "22222222-2222-4222-8222-222222222202";

const cookieJar = { value: undefined as string | undefined };

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "cforge_session" && cookieJar.value ? { value: cookieJar.value } : undefined,
    set: () => undefined,
    delete: () => undefined,
  }),
}));

function sessionCookie(studentId: string, rollIdentifier: string) {
  return encodeSession(SECRET, { studentId, rollIdentifier });
}

function studentReq(path: string, studentId: string, roll: string, init?: RequestInit) {
  cookieJar.value = sessionCookie(studentId, roll);
  return new Request(`http://127.0.0.1${path}`, {
    ...init,
    headers: {
      host: "127.0.0.1",
      cookie: `cforge_session=${cookieJar.value}`,
      "content-type": "application/json",
      ...init?.headers,
    },
  });
}

beforeEach(async () => {
  cookieJar.value = undefined;
  process.env.NODE_ENV = "test";
  process.env.FACULTY_TOKEN = FACULTY;
  process.env.SESSION_SECRET = SECRET;
  delete process.env.DATABASE_URL;
  delete process.env.FACULTY_DATABASE_URL;
  delete process.env.CFORGE_TRUST_PROXY;
  await closeSql();
  resetStore();
  resetRoster();
  seedRoster();
  resetLearningStore();
});

afterEach(async () => {
  cookieJar.value = undefined;
  await closeSql();
});

describe("session signatures and shape", () => {
  it("rejects SHA-256 concat signatures and extra claims", () => {
    const session = { studentId: STUDENT_A, rollIdentifier: "26EG104G01", faculty: true };
    const payload = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
    const legacy = createHash("sha256").update(`${SECRET}.${payload}`).digest("hex");
    expect(decodeSession(SECRET, `${payload}.${legacy}`)).toBeNull();
    const decoded = decodeSession(SECRET, encodeSession(SECRET, session as { studentId: string; rollIdentifier: string }));
    expect(decoded).toEqual({ studentId: STUDENT_A, rollIdentifier: "26EG104G01" });
    expect(decoded).not.toHaveProperty("faculty");
    expect(decodeSession(SECRET, encodeSession(SECRET, { studentId: "not-a-uuid", rollIdentifier: "26EG104G01" }))).toBeNull();
    expect(signPayload(SECRET, payload)).not.toBe(legacy);
  });
});

describe("unauthenticated and faculty authorization", () => {
  it("rejects unauthenticated student reads and student-shaped faculty calls", async () => {
    cookieJar.value = undefined;
    expect((await getMe()).status).toBe(401);
    expect((await getFacultyOverview(new Request("http://127.0.0.1/api/v1/faculty/overview"))).status).toBe(401);
    const student = studentReq("/api/v1/faculty/overview", STUDENT_A, "26EG104G01");
    expect((await getFacultyOverview(student)).status).toBe(401);
    expect((await getFacultyLabs(student)).status).toBe(401);
    expect(
      facultyAuthorized(
        new Request("http://127.0.0.1/api/v1/faculty/overview", {
          headers: { authorization: `Bearer ${FACULTY}x` },
        }),
      ),
    ).toBe(false);
    expect(
      facultyAuthorized(
        new Request("http://127.0.0.1/api/v1/faculty/overview", {
          headers: { authorization: `Bearer ${FACULTY}` },
        }),
      ),
    ).toBe(true);
  });
});

describe("student isolation and mass assignment", () => {
  it("returns 404 when student B fetches student A's diagnostic", async () => {
    const started = await startDiagnostic(STUDENT_A);
    expect(started.ok).toBe(true);
    if (!started.ok) return;
    const foreign = await getDiagnostic(studentReq(`/api/v1/diagnostics/${started.session.id}`, STUDENT_B, "26EG104G02"), {
      params: Promise.resolve({ id: started.session.id }),
    });
    expect(foreign.status).toBe(404);
    expect(await foreign.json()).toEqual({ error: "not_found" });
    const owner = await getDiagnostic(studentReq(`/api/v1/diagnostics/${started.session.id}`, STUDENT_A, "26EG104G01"), {
      params: Promise.resolve({ id: started.session.id }),
    });
    expect(owner.status).toBe(200);
    const body = await owner.json();
    expect(JSON.stringify(body)).not.toMatch(/expected|answerKey|passwordHash|facultyToken/i);
  });

  it("rejects client-driven mastery kinds", async () => {
    const response = await postProgress(
      studentReq("/api/v1/progress", STUDENT_A, "26EG104G01", {
        method: "POST",
        body: JSON.stringify({
          topicId: "pointers",
          kind: "assessment_completed",
          dimension: "mastery",
          studentId: STUDENT_B,
          earned: 100,
        }),
      }),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: "derived_state_not_writable" });
  });
});

describe("invitation enumeration and CSRF", () => {
  it("maps roll mismatch to invalid_invitation on HTTP", async () => {
    const minted = await mintInvitation("26EG104G01", 1);
    expect(minted.ok).toBe(true);
    if (!minted.ok) return;
    const response = await acceptInvite(
      new Request("http://127.0.0.1/api/v1/auth/invite/accept", {
        method: "POST",
        headers: { host: "127.0.0.1", "content-type": "application/json" },
        body: JSON.stringify({
          token: minted.token,
          rollIdentifier: "26EG104G02",
          password: "password1234",
        }),
      }),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_invitation" });
  });

  it("rejects cross-origin cookie mutations and oversized bodies", async () => {
    const csrf = rejectCrossOrigin(
      new Request("http://127.0.0.1/api/v1/auth/login", {
        headers: { host: "127.0.0.1", origin: "https://evil.example" },
      }),
    );
    expect(csrf?.status).toBe(403);
    const previousPublic = process.env.CFORGE_PUBLIC_ORIGIN;
    process.env.CFORGE_PUBLIC_ORIGIN = "https://cforge.vercel.app";
    expect(
      rejectCrossOrigin(
        new Request("http://cforge-api.onrender.com/api/v1/auth/login", {
          headers: { host: "cforge-api.onrender.com", origin: "https://cforge.vercel.app" },
        }),
      ),
    ).toBeNull();
    expect(
      rejectCrossOrigin(
        new Request("http://cforge-api.onrender.com/api/v1/auth/login", {
          headers: { host: "cforge-api.onrender.com", origin: "https://evil.example" },
        }),
      )?.status,
    ).toBe(403);
    if (previousPublic === undefined) delete process.env.CFORGE_PUBLIC_ORIGIN;
    else process.env.CFORGE_PUBLIC_ORIGIN = previousPublic;
    const loginCsrf = await login(
      new Request("http://127.0.0.1/api/v1/auth/login", {
        method: "POST",
        headers: { host: "127.0.0.1", origin: "https://evil.example", "content-type": "application/json" },
        body: JSON.stringify({ rollIdentifier: "26EG104G01", password: "password1234" }),
      }),
    );
    expect(loginCsrf.status).toBe(403);
    const huge = await login(
      new Request("http://127.0.0.1/api/v1/auth/login", {
        method: "POST",
        headers: { host: "127.0.0.1", "content-type": "application/json", "content-length": "200000" },
        body: "x",
      }),
    );
    expect(huge.status).toBe(413);
    const parsed = await readJsonBody(
      new Request("http://127.0.0.1/x", {
        method: "POST",
        body: "x".repeat(70_000),
      }),
    );
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.response.status).toBe(413);
    const malformed = await login(
      new Request("http://127.0.0.1/api/v1/auth/login", {
        method: "POST",
        headers: { host: "127.0.0.1", "content-type": "application/json" },
        body: "{not-json",
      }),
    );
    expect(malformed.status).toBe(400);
  });
});

describe("error and secret leakage", () => {
  it("keeps ready payloads free of role and credential notes and sets no-store", async () => {
    const headers = json(200, { ok: true }).headers;
    expect(headers.get("cache-control")).toBe("no-store");
    expect(headers.get("x-content-type-options")).toBe("nosniff");
    const response = await getReady();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.roleNote).toBeUndefined();
    expect(JSON.stringify(body)).not.toMatch(/postgres:\/\/|password|cforge_app|SET LOCAL ROLE/i);
  });

  it("does not distinguish unknown rolls before password verify", async () => {
    expect(await loginStudent("26EG104G54", "password1234")).toBeNull();
    expect(await loginStudent("nobody-roll", "password1234")).toBeNull();
  });

  it("does not return invitation tokens to students", async () => {
    const minted = await postFacultyInvite(
      new Request("http://127.0.0.1/api/v1/faculty/invitations", {
        method: "POST",
        headers: { authorization: `Bearer ${FACULTY}`, "content-type": "application/json" },
        body: JSON.stringify({ rollNumber: "26EG104G09", ttlHours: 1 }),
      }),
    );
    expect(minted.status).toBe(201);
    const payload = await minted.json();
    expect(payload.token).toBeTruthy();
    cookieJar.value = undefined;
    const studentMint = await postFacultyInvite(
      studentReq("/api/v1/faculty/invitations", STUDENT_A, "26EG104G01", {
        method: "POST",
        body: JSON.stringify({ rollNumber: "26EG104G10", ttlHours: 1 }),
      }),
    );
    expect(studentMint.status).toBe(401);
    expect(await studentMint.json()).toEqual({ error: "unauthorized" });
  });
});
