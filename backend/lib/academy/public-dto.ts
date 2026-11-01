export type ExerciseRow = {
  id: string;
  slug: string;
  title: string;
  objective: string;
  statement: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  starterCode: string;
  language: string;
  tests: Array<{
    ordinal: number;
    visibility: "sample" | "hidden";
    stdin: string;
    expectedStdout: string;
  }>;
};

export function toPublicExercise(row: ExerciseRow) {
  const sample = row.tests.find((test) => test.visibility === "sample");
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    objective: row.objective,
    statement: row.statement,
    inputFormat: row.inputFormat,
    outputFormat: row.outputFormat,
    constraints: row.constraints,
    starterCode: row.starterCode,
    language: row.language,
    sample: sample
      ? { stdin: sample.stdin, stdout: sample.expectedStdout }
      : { stdin: "", stdout: "" },
  };
}

export function toPublicSubmitResult(result: {
  verdict: string;
  passed: number;
  total: number;
  compiler?: string;
  tests: Array<{ ordinal: number; passed: boolean; visibility?: string; stdin?: string; expected?: string }>;
}) {
  return {
    mode: "submit" as const,
    verdict: result.verdict,
    passed: result.passed,
    total: result.total,
    compiler: result.compiler ?? "",
    tests: result.tests.map((test) => ({
      ordinal: test.ordinal,
      passed: test.passed,
    })),
  };
}

export function assertNoHiddenLeak(payload: unknown) {
  const text = JSON.stringify(payload);
  if (text.includes("expectedStdout") || text.includes("visibility")) {
    throw new Error("hidden test field leaked");
  }
  if (/"expected"\s*:/.test(text)) {
    throw new Error("hidden test field leaked");
  }
}
