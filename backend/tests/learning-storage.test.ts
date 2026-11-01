import { describe, expect, it } from "vitest";
import { loadEnv } from "@/lib/academy/env";
import {
  assertProductionLearningStorage,
  learningStorageMode,
  requireStudentId,
} from "@/lib/learning/storage-mode";

describe("production persistence policy", () => {
  it("uses memory in tests and local when DATABASE_URL is absent", () => {
    expect(learningStorageMode({ NODE_ENV: "test" })).toBe("memory");
    expect(learningStorageMode({ NODE_ENV: "development", ALLOW_MEMORY_LEARNING: "1" })).toBe("memory");
  });

  it("forbids memory fallback in production", () => {
    const production = {
      NODE_ENV: "production",
      SESSION_SECRET: "a".repeat(40),
      DATABASE_URL: "postgres://cforge_app:x@127.0.0.1/cforge",
      FACULTY_TOKEN: "strong-faculty-token",
      FACULTY_DATABASE_URL: "postgres://cforge_faculty:x@127.0.0.1/cforge",
      CFORGE_PUBLIC_ORIGIN: "https://cforge.vercel.app",
    };
    expect(() =>
      loadEnv({
        ...production,
        ALLOW_MEMORY_LEARNING: "1",
      }),
    ).toThrow(/ALLOW_MEMORY_LEARNING/);
    expect(() =>
      assertProductionLearningStorage({
        ...production,
        ALLOW_MEMORY_LEARNING: "1",
      }),
    ).toThrow(/forbidden/);
    expect(learningStorageMode(production)).toBe("postgres");
  });

  it("fails closed without a student UUID", () => {
    expect(() => requireStudentId(undefined)).toThrow(/missing_student_identity/);
    expect(() => requireStudentId("s-not-a-uuid")).toThrow(/missing_student_identity/);
    expect(requireStudentId("11111111-1111-4111-8111-111111111111")).toBe(
      "11111111-1111-4111-8111-111111111111",
    );
  });
});
