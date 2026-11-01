import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { assertJudgeConfigured, loadEnv } from "@/lib/academy/env";

describe("production path does not use demo data or a simulated judge", () => {
  it("serves the public catalog from the original curriculum", async () => {
    const { GET } = await import("@/app/api/v1/bridge/catalog/route");
    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.units).toHaveLength(5);
    expect(body.foundation.topics).toHaveLength(17);
    expect(body.foundation.notAnOfficialUnit).toBe(true);
    expect(JSON.stringify(body)).not.toMatch(/DEMO-|Aarav|fictional/i);
  });

  it("refuses judge execution when isolation is not configured", () => {
    const env = loadEnv({ NODE_ENV: "development" });
    expect(() => assertJudgeConfigured(env)).toThrow(/JUDGE_UNAVAILABLE/);
  });

  it("keeps the Emergent client on the real adapter unless demo mode is explicit", () => {
    const index = readFileSync("emergent-source/src/services/index.ts", "utf8");
    const client = readFileSync("emergent-source/src/services/cforge-api.ts", "utf8");
    expect(index).toMatch(/VITE_CFORGE_DEMO/);
    expect(index).toMatch(/cforgeServices/);
    expect(client).not.toMatch(/data\/fixtures/);
    expect(client).toMatch(/isSimulated: false/);
    expect(client).toMatch(/isPreview: false/);
  });
});
