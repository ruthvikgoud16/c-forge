import { createServer } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { loadEnv } from "@/lib/academy/env";
import { runExercise, submitExercise } from "@/lib/academy/execute";
import { helloCforge } from "@/lib/academy/exercise-data";
import { assertNoHiddenLeak } from "@/lib/academy/public-dto";
import { getFirecrackerJudge, installFirecrackerPortForTests } from "@/lib/judge/client";
import {
  FIRECRACKER_LIMITS,
  assertNoAnswerKeyInGuestPayload,
  judgePrivateEndpoint,
} from "@/lib/judge/firecracker-contract";
import { HttpFirecrackerJudge } from "@/lib/judge/http-firecracker";
import { MockFirecrackerHost } from "@/lib/judge/mock-firecracker";

const SOURCE = "int main(void){return 0;}\n";
const SECRET = "s2s-judge-secret-for-tests";

afterEach(() => {
  installFirecrackerPortForTests(null);
});

describe("Firecracker integration contract", () => {
  it("creates an exclusive job, streams stdin, and compiles once", async () => {
    const host = new MockFirecrackerHost({ secret: SECRET });
    const auth = `Bearer ${SECRET}`;
    const created = await host.createJob(auth, { source: SOURCE, language: "c11", ownerId: "student-a" });
    expect(created.status).toBe("ready");
    if (created.status !== "ready") return;
    const first = await host.runJob(auth, { jobId: created.jobId, ownerId: "student-a", stdin: "1 2\n" });
    const second = await host.runJob(auth, { jobId: created.jobId, ownerId: "student-a", stdin: "3\n" });
    expect(first).toMatchObject({ status: "ok", stdout: "out:1 2\n" });
    expect(second).toMatchObject({ status: "ok", stdout: "out:3\n" });
    expect(host.job(created.jobId)?.compileCount).toBe(1);
    expect(host.job(created.jobId)?.runCount).toBe(2);
    expect(host.job(created.jobId)?.vmId).toMatch(/^vm-/);
    await host.destroyJob(auth, { jobId: created.jobId, ownerId: "student-a" });
    expect(host.job(created.jobId)).toBeUndefined();
  });

  it("rejects missing or wrong server authentication", async () => {
    const host = new MockFirecrackerHost({ secret: SECRET });
    const created = await host.createJob("Bearer wrong", { source: SOURCE, language: "c11", ownerId: "a" });
    expect(created.status).toBe("unauthorized");
    expect(await host.runJob("", { jobId: "x", ownerId: "a", stdin: "" })).toMatchObject({ status: "unauthorized" });
  });

  it("caps output and rejects oversized stdin", async () => {
    const host = new MockFirecrackerHost({ secret: SECRET });
    const auth = `Bearer ${SECRET}`;
    const flood = await host.createJob(auth, {
      source: "int main(void){ /* __FLOOD__ */ return 0; }\n",
      language: "c11",
      ownerId: "a",
    });
    expect(flood.status).toBe("ready");
    if (flood.status !== "ready") return;
    const ran = await host.runJob(auth, { jobId: flood.jobId, ownerId: "a", stdin: "" });
    expect(ran.status).toBe("ok");
    expect(ran.stdout.length).toBe(FIRECRACKER_LIMITS.stdoutBytes);
    const huge = await host.runJob(auth, {
      jobId: flood.jobId,
      ownerId: "a",
      stdin: "y".repeat(FIRECRACKER_LIMITS.stdinBytes + 1),
    });
    expect(huge.status).toBe("invalid");
  });

  it("times out marked jobs and expires stale ones", async () => {
    let now = 1_000;
    const host = new MockFirecrackerHost({ secret: SECRET, jobTtlMs: 50, now: () => now });
    const auth = `Bearer ${SECRET}`;
    const timed = await host.createJob(auth, {
      source: "int main(void){ /* __TIMEOUT__ */ return 0; }\n",
      language: "c11",
      ownerId: "a",
    });
    expect(timed.status).toBe("ready");
    if (timed.status !== "ready") return;
    expect(await host.runJob(auth, { jobId: timed.jobId, ownerId: "a", stdin: "" })).toMatchObject({
      status: "timeout",
    });
    const stale = await host.createJob(auth, { source: SOURCE, language: "c11", ownerId: "a" });
    expect(stale.status).toBe("ready");
    if (stale.status !== "ready") return;
    now += 100;
    expect(await host.runJob(auth, { jobId: stale.jobId, ownerId: "a", stdin: "" })).toMatchObject({
      status: "expired",
    });
  });

  it("isolates jobs by owner and forbids answer keys in guest payloads", async () => {
    const host = new MockFirecrackerHost({ secret: SECRET });
    const auth = `Bearer ${SECRET}`;
    const a = await host.createJob(auth, { source: SOURCE, language: "c11", ownerId: "alice" });
    const b = await host.createJob(auth, { source: SOURCE, language: "c11", ownerId: "bob" });
    expect(a.status).toBe("ready");
    expect(b.status).toBe("ready");
    if (a.status !== "ready" || b.status !== "ready") return;
    expect(a.vmId).not.toBe(b.vmId);
    expect(await host.runJob(auth, { jobId: a.jobId, ownerId: "bob", stdin: "" })).toMatchObject({
      status: "forbidden",
    });
    expect(() =>
      assertNoAnswerKeyInGuestPayload({ source: SOURCE, expectedStdout: "secret" }),
    ).toThrow(/answer key/);
    const leaked = await host.createJob(auth, {
      source: SOURCE,
      language: "c11",
      ownerId: "alice",
      expectedStdout: "nope",
    } as never);
    expect(leaked.status).toBe("invalid");
  });

  it("destroys jobs and saturates the queue", async () => {
    const host = new MockFirecrackerHost({ secret: SECRET, maxJobs: 2 });
    const auth = `Bearer ${SECRET}`;
    const first = await host.createJob(auth, { source: SOURCE, language: "c11", ownerId: "a" });
    const second = await host.createJob(auth, { source: SOURCE, language: "c11", ownerId: "a" });
    const third = await host.createJob(auth, { source: SOURCE, language: "c11", ownerId: "a" });
    expect(first.status).toBe("ready");
    expect(second.status).toBe("ready");
    expect(third.status).toBe("queue_full");
    if (first.status !== "ready") return;
    expect(await host.destroyJob(auth, { jobId: first.jobId, ownerId: "a" })).toEqual({ status: "destroyed" });
    expect(await host.destroyJob(auth, { jobId: first.jobId, ownerId: "a" })).toEqual({ status: "not_found" });
    const again = await host.createJob(auth, { source: SOURCE, language: "c11", ownerId: "a" });
    expect(again.status).toBe("ready");
    expect(host.guestNetwork).toBe("none");
    expect(host.guestTransport).toBe("vsock");
  });

  it("handles compile and runtime failures without claiming VM isolation", async () => {
    const host = new MockFirecrackerHost({ secret: SECRET });
    const auth = `Bearer ${SECRET}`;
    const compile = await host.createJob(auth, {
      source: '#include "/proc/1/environ"\nint main(void){return 0;}\n',
      language: "c11",
      ownerId: "a",
    });
    expect(compile).toMatchObject({ status: "compile_error", compiler: "blocked include" });
    const crash = await host.createJob(auth, {
      source: "int main(void){ /* __CRASH__ */ return 0; }\n",
      language: "c11",
      ownerId: "a",
    });
    expect(crash.status).toBe("ready");
    if (crash.status !== "ready") return;
    expect(await host.runJob(auth, { jobId: crash.jobId, ownerId: "a", stdin: "" })).toMatchObject({
      status: "runtime_error",
    });
  });

  it("HTTP client talks the job API and refuses a public judge URL", async () => {
    expect(judgePrivateEndpoint("http://203.0.113.8:7080")).toBe(false);
    expect(() => new HttpFirecrackerJudge("https://example.com/judge")).toThrow(/private/);

    const host = new MockFirecrackerHost({ secret: SECRET });
    const server = createServer(async (req, res) => {
      const auth = req.headers.authorization ?? "";
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk as Buffer);
      const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {};
      let result: unknown = { status: "not_found" };
      if (req.method === "POST" && req.url === "/v1/jobs") {
        result = await host.createJob(auth, body);
      } else if (req.method === "POST" && (req.url?.endsWith("/run") || req.url?.endsWith("/stdin"))) {
        const jobId = req.url.split("/")[3] ?? "";
        result = await host.runJob(auth, { jobId, ownerId: body.ownerId, stdin: body.stdin });
      } else if (req.method === "DELETE") {
        const jobId = req.url?.split("/")[3] ?? "";
        result = await host.destroyJob(auth, { jobId, ownerId: body.ownerId });
      }
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(result));
    });
    const url = await new Promise<string>((resolve) => {
      server.listen(0, "127.0.0.1", () => {
        const addr = server.address();
        if (!addr || typeof addr === "string") throw new Error("no port");
        resolve(`http://127.0.0.1:${addr.port}`);
      });
    });
    try {
      const client = new HttpFirecrackerJudge(url);
      const created = await client.createJob(`Bearer ${SECRET}`, {
        source: SOURCE,
        language: "c11",
        ownerId: "http-owner",
      });
      expect(created.status).toBe("ready");
      if (created.status !== "ready") return;
      const ran = await client.runJob(`Bearer ${SECRET}`, {
        jobId: created.jobId,
        ownerId: "http-owner",
        stdin: "z",
      });
      expect(ran).toMatchObject({ status: "ok", stdout: "out:z" });
      expect(await client.destroyJob(`Bearer ${SECRET}`, { jobId: created.jobId, ownerId: "http-owner" })).toEqual({
        status: "destroyed",
      });
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it("academy submit compares expected output locally after one compile", async () => {
    const host = new MockFirecrackerHost({ secret: SECRET });
    installFirecrackerPortForTests(host);
    const env = loadEnv({
      NODE_ENV: "development",
      SESSION_SECRET: "dev-session",
      JUDGE_URL: "http://127.0.0.1:7080",
      JUDGE_SECRET: SECRET,
      JUDGE_BACKEND: "mock",
    });
    expect(env.judgeAllowProduction).toBe(false);
    expect(getFirecrackerJudge(env)?.kind).toBe("mock");
    const exercise = {
      ...helloCforge,
      tests: [
        { ordinal: 1, visibility: "sample" as const, stdin: "hello\n", expectedStdout: "out:hello\n" },
        { ordinal: 2, visibility: "hidden" as const, stdin: "hid\n", expectedStdout: "out:hid\n" },
      ],
    };
    const submitted = await submitExercise(env, exercise, SOURCE, { ownerId: "student-1" });
    expect(submitted.verdict).toBe("accepted");
    expect(submitted.passed).toBe(2);
    assertNoHiddenLeak(submitted);
    expect(host.activeJobs()).toBe(0);

    const run = await runExercise(env, exercise, SOURCE, "custom\n", { ownerId: "student-1" });
    expect(run.mode).toBe("run");
    expect(run.stdout).toBe("out:custom\n");

    const prod = loadEnv({
      NODE_ENV: "production",
      SESSION_SECRET: "a".repeat(40),
      DATABASE_URL: "postgres://cforge_app:x@127.0.0.1/cforge",
      FACULTY_TOKEN: "strong-faculty-token",
      FACULTY_DATABASE_URL: "postgres://cforge_faculty:x@127.0.0.1/cforge",
      CFORGE_PUBLIC_ORIGIN: "https://cforge.vercel.app",
      JUDGE_URL: "http://127.0.0.1:7080",
      JUDGE_SECRET: "strong-judge-secret-not-a-placeholder",
      JUDGE_BACKEND: "firecracker",
    });
    expect(prod.judgeAllowProduction).toBe(false);
    await expect(runExercise(prod, exercise, SOURCE, "", { ownerId: "student-1" })).rejects.toMatchObject({
      code: "JUDGE_DISABLED_UNVERIFIED_ISOLATION",
    });
  });
});
