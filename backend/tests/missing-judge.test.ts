import { describe, expect, it } from "vitest";
import { helloCforge } from "@/lib/academy/exercise-data";
import { loadEnv } from "@/lib/academy/env";
import { runExercise } from "@/lib/academy/execute";
import { isJudgeUnavailable } from "@/lib/academy/errors";

describe("missing judge configuration", () => {
  it("fails closed when JUDGE_URL is absent", async () => {
    const env = loadEnv({
      NODE_ENV: "production",
      SESSION_SECRET: "production-session-secret-value-32ch",
      DATABASE_URL: "postgres://cforge_app:x@127.0.0.1:5432/cforge",
      FACULTY_TOKEN: "strong-faculty-token",
      FACULTY_DATABASE_URL: "postgres://cforge_faculty:x@127.0.0.1:5432/cforge",
      CFORGE_PUBLIC_ORIGIN: "https://cforge.vercel.app",
    });
    try {
      await runExercise(env, helloCforge, "int main(){return 0;}", "");
      throw new Error("should have thrown");
    } catch (error) {
      expect(isJudgeUnavailable(error)).toBe(true);
    }
  });
});
