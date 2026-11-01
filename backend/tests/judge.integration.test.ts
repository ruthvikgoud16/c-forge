import http from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { helloCforge } from "@/lib/academy/exercise-data";
import { loadEnv } from "@/lib/academy/env";
import { runExercise, submitExercise } from "@/lib/academy/execute";
import { isolateExecute } from "../services/judge/src/isolate.mjs";
import { spawnSync } from "node:child_process";

const gccProbe = spawnSync("gcc", ["-std=c11", "-x", "c", "-o", "/tmp/cforge-gcc-probe", "-"], {
  input: "int main(void){return 0;}\n",
  encoding: "utf8",
});
const gccAvailable = gccProbe.status === 0;

function mockJudge(
  handler: (body: { source: string; stdin: string }) => {
    status: string;
    stdout: string;
    stderr: string;
    compiler: string;
  },
) {
  const secret = "test-judge-secret";
  const server = http.createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      if (req.headers.authorization !== `Bearer ${secret}`) {
        res.writeHead(401);
        res.end();
        return;
      }
      const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      const result = handler(body);
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(result));
    });
  });
  return new Promise<{ url: string; close: () => Promise<void> }>((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("no port");
      resolve({
        url: `http://127.0.0.1:${address.port}`,
        close: () => new Promise((r) => server.close(() => r())),
      });
    });
  });
}

const baseEnv = {
  NODE_ENV: "development",
  SESSION_SECRET: "dev-session",
  JUDGE_SECRET: "test-judge-secret",
};

describe("run vs submit against a judge", () => {
  let close: undefined | (() => Promise<void>);
  afterEach(async () => {
    if (close) await close();
    close = undefined;
  });

  it("accepts a valid Hello, CForge! submission", async () => {
    const judge = await mockJudge(() => ({
      status: "ok",
      stdout: "Hello, CForge!\n",
      stderr: "",
      compiler: "",
    }));
    close = judge.close;
    const env = loadEnv({ ...baseEnv, JUDGE_URL: judge.url });
    const result = await submitExercise(env, helloCforge, "valid");
    expect(result.verdict).toBe("accepted");
    expect(result.passed).toBe(4);
    expect(JSON.stringify(result)).not.toContain("ignored-hidden-stdin");
  });

  it("marks incorrect output", async () => {
    const judge = await mockJudge(() => ({
      status: "ok",
      stdout: "hello\n",
      stderr: "",
      compiler: "",
    }));
    close = judge.close;
    const env = loadEnv({ ...baseEnv, JUDGE_URL: judge.url });
    const result = await submitExercise(env, helloCforge, "wrong");
    expect(result.verdict).toBe("wrong_answer");
  });

  it("surfaces compilation errors", async () => {
    const judge = await mockJudge(() => ({
      status: "compile_error",
      stdout: "",
      stderr: "error: expected",
      compiler: "error: expected",
    }));
    close = judge.close;
    const env = loadEnv({ ...baseEnv, JUDGE_URL: judge.url });
    const result = await submitExercise(env, helloCforge, "bad");
    expect(result.verdict).toBe("compile_error");
  });

  it("surfaces runtime errors", async () => {
    const judge = await mockJudge(() => ({
      status: "runtime_error",
      stdout: "",
      stderr: "abort",
      compiler: "",
    }));
    close = judge.close;
    const env = loadEnv({ ...baseEnv, JUDGE_URL: judge.url });
    const result = await submitExercise(env, helloCforge, "abort");
    expect(result.verdict).toBe("runtime_error");
  });

  it("surfaces infinite-loop timeouts", async () => {
    const judge = await mockJudge(() => ({
      status: "timeout",
      stdout: "",
      stderr: "",
      compiler: "",
    }));
    close = judge.close;
    const env = loadEnv({ ...baseEnv, JUDGE_URL: judge.url });
    const result = await submitExercise(env, helloCforge, "loop");
    expect(result.verdict).toBe("timeout");
  });

  it("treats memory exhaustion as a runtime failure", async () => {
    const judge = await mockJudge(() => ({
      status: "runtime_error",
      stdout: "",
      stderr: "killed",
      compiler: "",
    }));
    close = judge.close;
    const env = loadEnv({ ...baseEnv, JUDGE_URL: judge.url });
    const result = await submitExercise(env, helloCforge, "oom");
    expect(result.verdict).toBe("runtime_error");
  });

  it("keeps hidden tests off the run response", async () => {
    const judge = await mockJudge((body) => ({
      status: "ok",
      stdout: `custom:${body.stdin}`,
      stderr: "",
      compiler: "",
    }));
    close = judge.close;
    const env = loadEnv({ ...baseEnv, JUDGE_URL: judge.url });
    const result = await runExercise(env, helloCforge, "src", "abc");
    expect(result.mode).toBe("run");
    expect(result.stdout).toBe("custom:abc");
    expect(JSON.stringify(result)).not.toContain("hidden");
  });

  it("handles concurrent submissions", async () => {
    let inflight = 0;
    let max = 0;
    const judge = await mockJudge(() => {
      inflight += 1;
      max = Math.max(max, inflight);
      inflight -= 1;
      return { status: "ok", stdout: "Hello, CForge!\n", stderr: "", compiler: "" };
    });
    close = judge.close;
    const env = loadEnv({ ...baseEnv, JUDGE_URL: judge.url });
    const [a, b] = await Promise.all([
      submitExercise(env, helloCforge, "a"),
      submitExercise(env, helloCforge, "b"),
    ]);
    expect(a.verdict).toBe("accepted");
    expect(b.verdict).toBe("accepted");
    expect(max).toBeGreaterThanOrEqual(1);
  });
});

describe.skipIf(!gccAvailable)("local gcc isolate", () => {
  it("compiles the accepted greeting", async () => {
    const result = await isolateExecute({
      source: '#include <stdio.h>\nint main(void){puts("Hello, CForge!");return 0;}\n',
      stdin: "",
      timeLimitMs: 2000,
    });
    expect(result.status).toBe("ok");
    expect(result.stdout).toBe("Hello, CForge!\n");
  });

  it("times out an infinite loop", async () => {
    const result = await isolateExecute({
      source: "int main(void){for(;;){}}",
      stdin: "",
      timeLimitMs: 400,
    });
    expect(result.status).toBe("timeout");
  });
});
