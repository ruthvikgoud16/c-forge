import { callJudge } from "./judge";
import { outputsMatch } from "./compare";
import { toPublicSubmitResult, type ExerciseRow } from "./public-dto";
import { assertJudgeConfigured, type AcademyEnv } from "./env";
import { bearerFor, firecrackerBackend, getFirecrackerJudge } from "@/lib/judge/client";
import { assertNoAnswerKeyInGuestPayload } from "@/lib/judge/firecracker-contract";
import type { FirecrackerJudgePort } from "@/lib/judge/firecracker-port";

export type ExecuteContext = {
  ownerId?: string;
};

export class JudgeQueueFullError extends Error {
  code = "JUDGE_QUEUE_FULL";
  httpStatus = 503;
  constructor() {
    super("JUDGE_QUEUE_FULL");
  }
}

function requireOwner(ctx?: ExecuteContext) {
  const ownerId = ctx?.ownerId?.trim();
  if (!ownerId) {
    throw Object.assign(new Error("judge job owner required"), { code: "JUDGE_UNAVAILABLE", httpStatus: 503 });
  }
  return ownerId;
}

async function withFirecrackerJob<T>(
  env: AcademyEnv,
  client: FirecrackerJudgePort,
  source: string,
  ownerId: string,
  fn: (jobId: string) => Promise<T>,
  onCompileError: (compiler: string) => T,
): Promise<T> {
  const createBody = { source, language: "c11" as const, ownerId };
  assertNoAnswerKeyInGuestPayload(createBody);
  const created = await client.createJob(bearerFor(env), createBody);
  if (created.status === "unauthorized") {
    throw Object.assign(new Error("JUDGE_UNAVAILABLE"), { code: "JUDGE_UNAVAILABLE", httpStatus: 503 });
  }
  if (created.status === "queue_full") throw new JudgeQueueFullError();
  if (created.status === "invalid") {
    throw Object.assign(new Error(created.error), { code: "JUDGE_UNAVAILABLE", httpStatus: 503 });
  }
  if (created.status === "compile_error") return onCompileError(created.compiler);
  const jobId = created.jobId;
  try {
    return await fn(jobId);
  } finally {
    await client.destroyJob(bearerFor(env), { jobId, ownerId }).catch(() => undefined);
  }
}

export async function runExercise(
  env: AcademyEnv,
  exercise: ExerciseRow,
  source: string,
  customStdin: string | undefined,
  ctx?: ExecuteContext,
) {
  assertJudgeConfigured(env);
  const sample = exercise.tests.find((t) => t.visibility === "sample");
  const stdin = customStdin !== undefined && customStdin.length > 0 ? customStdin : (sample?.stdin ?? "");
  const backend = firecrackerBackend(env);
  if (backend === "firecracker" || backend === "mock") {
    const client = getFirecrackerJudge(env);
    if (!client) {
      throw Object.assign(new Error("JUDGE_UNAVAILABLE"), { code: "JUDGE_UNAVAILABLE", httpStatus: 503 });
    }
    const ownerId = requireOwner(ctx);
    return withFirecrackerJob(
      env,
      client,
      source,
      ownerId,
      async (jobId) => {
        const runBody = { jobId, ownerId, stdin };
        assertNoAnswerKeyInGuestPayload(runBody);
        const result = await client.runJob(bearerFor(env), runBody);
        return {
          mode: "run" as const,
          status: result.status === "ok" ? "ok" : result.status === "timeout" ? "timeout" : "runtime_error",
          stdout: result.stdout,
          stderr: result.stderr,
          compiler: "",
        };
      },
      (compiler) => ({
        mode: "run" as const,
        status: "compile_error" as const,
        stdout: "",
        stderr: compiler,
        compiler,
      }),
    );
  }

  const result = await callJudge(env, { source, stdin });
  return {
    mode: "run" as const,
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    compiler: result.compiler,
  };
}

export async function submitExercise(
  env: AcademyEnv,
  exercise: ExerciseRow,
  source: string,
  ctx?: ExecuteContext,
) {
  assertJudgeConfigured(env);
  const tests = [...exercise.tests].sort((a, b) => a.ordinal - b.ordinal);
  const backend = firecrackerBackend(env);
  if (backend === "firecracker" || backend === "mock") {
    const client = getFirecrackerJudge(env);
    if (!client) {
      throw Object.assign(new Error("JUDGE_UNAVAILABLE"), { code: "JUDGE_UNAVAILABLE", httpStatus: 503 });
    }
    const ownerId = requireOwner(ctx);
    return withFirecrackerJob(
      env,
      client,
      source,
      ownerId,
      async (jobId) => {
        const outcomes: Array<{ ordinal: number; passed: boolean }> = [];
        let verdict = "accepted";
        for (const test of tests) {
          const runBody = { jobId, ownerId, stdin: test.stdin };
          assertNoAnswerKeyInGuestPayload(runBody);
          const result = await client.runJob(bearerFor(env), runBody);
          if (result.status === "timeout") {
            verdict = "timeout";
            outcomes.push({ ordinal: test.ordinal, passed: false });
            continue;
          }
          if (result.status !== "ok") {
            verdict = "runtime_error";
            outcomes.push({ ordinal: test.ordinal, passed: false });
            continue;
          }
          const passed = outputsMatch(result.stdout, test.expectedStdout);
          outcomes.push({ ordinal: test.ordinal, passed });
          if (!passed && verdict === "accepted") verdict = "wrong_answer";
        }
        return toPublicSubmitResult({
          verdict,
          passed: outcomes.filter((row) => row.passed).length,
          total: tests.length,
          compiler: "",
          tests: outcomes,
        });
      },
      (compiler) =>
        toPublicSubmitResult({
          verdict: "compile_error",
          passed: 0,
          total: tests.length,
          compiler,
          tests: tests.map((test) => ({ ordinal: test.ordinal, passed: false })),
        }),
    );
  }

  const outcomes: Array<{ ordinal: number; passed: boolean }> = [];
  let verdict: string = "accepted";
  let compiler = "";

  for (const test of tests) {
    const result = await callJudge(env, { source, stdin: test.stdin });
    if (result.compiler) compiler = result.compiler;
    if (result.status === "compile_error") {
      verdict = "compile_error";
      outcomes.push({ ordinal: test.ordinal, passed: false });
      break;
    }
    if (result.status === "timeout") {
      verdict = "timeout";
      outcomes.push({ ordinal: test.ordinal, passed: false });
      continue;
    }
    if (result.status !== "ok") {
      verdict = "runtime_error";
      outcomes.push({ ordinal: test.ordinal, passed: false });
      continue;
    }
    const passed = outputsMatch(result.stdout, test.expectedStdout);
    outcomes.push({ ordinal: test.ordinal, passed });
    if (!passed && verdict === "accepted") verdict = "wrong_answer";
  }

  const passed = outcomes.filter((o) => o.passed).length;
  return toPublicSubmitResult({
    verdict,
    passed,
    total: tests.length,
    compiler,
    tests: outcomes,
  });
}
