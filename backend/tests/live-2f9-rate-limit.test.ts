import { afterAll, describe, expect, it } from "vitest";
import { POST as login } from "@/app/api/v1/auth/login/route";
import { closeSql } from "@/lib/academy/db";
import { loadEnvLocal } from "../scripts/load-env-local.mjs";

loadEnvLocal();
const live = Boolean(process.env.DATABASE_URL?.includes("/cforge"));

afterAll(async () => {
  await closeSql();
});

describe.skipIf(!live)("live 014 rate limiter", () => {
  it("returns 429 after the login bucket is exhausted", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 11; i += 1) {
      const response = await login(
        new Request("http://127.0.0.1/api/v1/auth/login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ rollIdentifier: "26EG104G54", password: "wrong-password-xx" }),
        }),
      );
      statuses.push(response.status);
    }
    expect(statuses.some((code) => code === 401 || code === 429)).toBe(true);
    expect(statuses.at(-1)).toBe(429);
    const blocked = await login(
      new Request("http://127.0.0.1/api/v1/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rollIdentifier: "26EG104G54", password: "wrong-password-xx" }),
      }),
    );
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("retry-after")).toBeTruthy();
    expect(await blocked.json()).toMatchObject({ error: "rate_limited" });
  });
});
