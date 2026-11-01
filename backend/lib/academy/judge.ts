import { assertJudgeConfigured, type AcademyEnv } from "./env";
import { refuseInProcessCompile } from "./refuse-in-process";

export type JudgeResult = {
  status: "ok" | "compile_error" | "runtime_error" | "timeout" | "internal_error";
  stdout: string;
  stderr: string;
  compiler: string;
  exitCode?: number;
};

export async function callJudge(
  env: AcademyEnv,
  input: { source: string; stdin: string; timeLimitMs?: number },
): Promise<JudgeResult> {
  assertJudgeConfigured(env);
  if (!env.judgeUrl.startsWith("http")) {
    refuseInProcessCompile();
  }

  const response = await fetch(`${env.judgeUrl.replace(/\/$/, "")}/execute`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.judgeSecret}`,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    return {
      status: "internal_error",
      stdout: "",
      stderr: `judge http ${response.status}`,
      compiler: "",
    };
  }
  return (await response.json()) as JudgeResult;
}
