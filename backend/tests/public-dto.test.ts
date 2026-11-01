import { describe, expect, it } from "vitest";
import { helloCforge } from "@/lib/academy/exercise-data";
import { assertNoHiddenLeak, toPublicExercise, toPublicSubmitResult } from "@/lib/academy/public-dto";

describe("hidden test confidentiality", () => {
  it("does not expose hidden stdin or expected outputs", () => {
    const dto = toPublicExercise(helloCforge);
    expect(JSON.stringify(dto)).not.toContain("ignored-hidden-stdin");
    expect(dto).not.toHaveProperty("tests");
    expect(dto.sample.stdout).toBe("Hello, CForge!\n");
    assertNoHiddenLeak(dto);
  });

  it("strips visibility and expected from submit results", () => {
    const result = toPublicSubmitResult({
      verdict: "accepted",
      passed: 4,
      total: 4,
      tests: [
        { ordinal: 1, passed: true, visibility: "hidden", stdin: "secret", expected: "Hello, CForge!\n" },
      ],
    });
    expect(result.tests[0]).toEqual({ ordinal: 1, passed: true });
    assertNoHiddenLeak(result);
  });
});
