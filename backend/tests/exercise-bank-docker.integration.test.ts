import { describe, expect, it } from "vitest";
import { EXPAND_JUDGE_EXERCISES, NEW_JUDGE_EXERCISES, findJudgeExercise } from "@/lib/academy/exercise-bank";
import { REFERENCE_SOLUTIONS } from "@/lib/academy/exercise-solutions";
import { loadEnv } from "@/lib/academy/env";
import { runExercise, submitExercise } from "@/lib/academy/execute";
import { assertNoHiddenLeak } from "@/lib/academy/public-dto";

const env = loadEnv(process.env);
const dockerJudge = Boolean(env.judgeUrl?.startsWith("http") && env.judgeSecret);

describe.skipIf(!dockerJudge)("Docker judge exercise bank (2F.3b)", () => {
  it(
    "runs samples, submits hidden tests, and reports wrong/compile without leaking keys",
    async () => {
      const rows = [...NEW_JUDGE_EXERCISES, ...EXPAND_JUDGE_EXERCISES];
      for (const row of rows) {
        const source = REFERENCE_SOLUTIONS[row.slug];
        const run = await runExercise(env, row, source, undefined);
        expect(run.mode).toBe("run");
        expect(run.status, `${row.slug} ${run.stderr} ${run.compiler}`).toBe("ok");
        expect(run.stdout).toBe(row.tests.find((t) => t.visibility === "sample")?.expectedStdout);
        const submit = await submitExercise(env, row, source);
        assertNoHiddenLeak(submit);
        expect(submit.verdict).toBe("accepted");
        expect(submit.passed).toBe(submit.total);
        expect(submit.total).toBe(4);
      }

      const echo = findJudgeExercise("echo-integer")!;
      const wrong = await submitExercise(env, echo, `#include <stdio.h>\nint main(void){puts("0");return 0;}\n`);
      assertNoHiddenLeak(wrong);
      expect(wrong.verdict).toBe("wrong_answer");
      expect(wrong.passed).toBeLessThan(wrong.total);

      const compile = await submitExercise(env, echo, "this is not c\n");
      assertNoHiddenLeak(compile);
      expect(compile.verdict).toBe("compile_error");
      expect(compile.compiler.length).toBeGreaterThan(0);

      const hello = await submitExercise(env, findJudgeExercise("hello-cforge")!, REFERENCE_SOLUTIONS["hello-cforge"]);
      expect(hello.verdict).toBe("accepted");
    },
    180_000,
  );
});
