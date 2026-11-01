import type { JudgeResult, JudgeVerdict } from "@/domain/types";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function field(row: Record<string, unknown>, key: string) {
  return row[key];
}

export function unavailableJudgeResult(mode: "run" | "submit"): JudgeResult {
  return {
    mode,
    verdict: "unavailable",
    compilerOutput: "The C judge is unavailable. This run was not compiled or executed.",
    stdout: "",
    isSimulated: false,
  };
}

export function verdictOf(raw: string): JudgeVerdict {
  if (raw === "accepted" || raw === "ok") return "accepted";
  if (raw === "wrong_answer" || raw === "wrong-answer") return "wrong-answer";
  if (raw === "runtime_error" || raw === "runtime-error" || raw === "timeout") return "runtime-error";
  if (raw === "unavailable" || raw === "JUDGE_UNAVAILABLE") return "unavailable";
  return "compile-error";
}

export function mapExecuteResponse(mode: "run" | "submit", status: number, body: unknown): JudgeResult {
  const row = asRecord(body);
  const error = String(field(row, "error") ?? field(row, "code") ?? "");
  if (status === 503 || error === "JUDGE_UNAVAILABLE") return unavailableJudgeResult(mode);
  const testsRaw = field(row, "tests");
  const tests = Array.isArray(testsRaw)
    ? testsRaw.map((test) => {
      const entry = asRecord(test);
      return { name: `Test ${String(field(entry, "ordinal") ?? "")}`.trim(), passed: Boolean(field(entry, "passed")) };
    })
    : undefined;
  const result: JudgeResult = {
    mode,
    verdict: verdictOf(String(field(row, "verdict") ?? field(row, "status") ?? "")),
    compilerOutput: String(field(row, "compiler") ?? field(row, "stderr") ?? ""),
    stdout: String(field(row, "stdout") ?? ""),
    isSimulated: false,
  };
  if (tests) result.tests = tests;
  if (JSON.stringify(result).includes("expectedStdout")) {
    throw new Error("hidden test field leaked");
  }
  return result;
}
