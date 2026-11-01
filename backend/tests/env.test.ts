import { describe, expect, it } from "vitest";
import { assertJudgeConfigured, loadEnv } from "@/lib/academy/env";

describe("environment validation", () => {
  it("accepts development without judge", () => {
    const env = loadEnv({ NODE_ENV: "development" });
    expect(env.isProduction).toBe(false);
  });

  it("rejects weak production session secrets", () => {
    expect(() =>
      loadEnv({
        NODE_ENV: "production",
        SESSION_SECRET: "secret",
        DATABASE_URL: "postgres://cforge_app:x@127.0.0.1/cforge",
        FACULTY_TOKEN: "strong-faculty-token",
        FACULTY_DATABASE_URL: "postgres://cforge_faculty:x@127.0.0.1/cforge",
      }),
    ).toThrow(/SESSION_SECRET/);
  });

  it("requires DATABASE_URL in production", () => {
    expect(() =>
      loadEnv({
        NODE_ENV: "production",
        SESSION_SECRET: "a".repeat(40),
        FACULTY_TOKEN: "strong-faculty-token",
        FACULTY_DATABASE_URL: "postgres://cforge_faculty:x@127.0.0.1/cforge",
      }),
    ).toThrow(/DATABASE_URL/);
  });

  it("requires a separate faculty database URL in production", () => {
    expect(() =>
      loadEnv({
        NODE_ENV: "production",
        SESSION_SECRET: "a".repeat(40),
        DATABASE_URL: "postgres://cforge_app:x@127.0.0.1/cforge",
        FACULTY_TOKEN: "strong-faculty-token",
        FACULTY_DATABASE_URL: "postgres://cforge_app:x@127.0.0.1/cforge",
      }),
    ).toThrow(/FACULTY_DATABASE_URL/);
  });

  it("rejects owner or migrator DATABASE_URL in production", () => {
    expect(() =>
      loadEnv({
        NODE_ENV: "production",
        SESSION_SECRET: "a".repeat(40),
        DATABASE_URL: "postgres://cforge:x@127.0.0.1/cforge",
        FACULTY_TOKEN: "strong-faculty-token",
        FACULTY_DATABASE_URL: "postgres://cforge_faculty:x@127.0.0.1/cforge",
      }),
    ).toThrow(/cforge_app/);
  });

  it("requires CFORGE_PUBLIC_ORIGIN in production", () => {
    expect(() =>
      loadEnv({
        NODE_ENV: "production",
        SESSION_SECRET: "a".repeat(40),
        DATABASE_URL: "postgres://cforge_app:x@127.0.0.1/cforge",
        FACULTY_TOKEN: "strong-faculty-token",
        FACULTY_DATABASE_URL: "postgres://cforge_faculty:x@127.0.0.1/cforge",
      }),
    ).toThrow(/CFORGE_PUBLIC_ORIGIN/);
  });

  it("assertJudgeConfigured uses HTTP 503 semantics", () => {
    const env = loadEnv({
      NODE_ENV: "production",
      SESSION_SECRET: "a".repeat(40),
      DATABASE_URL: "postgres://cforge_app:x@127.0.0.1/cforge",
      FACULTY_TOKEN: "strong-faculty-token",
      FACULTY_DATABASE_URL: "postgres://cforge_faculty:x@127.0.0.1/cforge",
      CFORGE_PUBLIC_ORIGIN: "https://cforge.vercel.app",
    });
    try {
      assertJudgeConfigured(env);
      throw new Error("should have thrown");
    } catch (error) {
      expect((error as { code: string; httpStatus: number }).code).toBe("JUDGE_UNAVAILABLE");
      expect((error as { httpStatus: number }).httpStatus).toBe(503);
    }
  });
});
