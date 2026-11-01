import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("2F.8.3 pg_hba template", () => {
  const hba = readFileSync("db/pg_hba.cforge.conf", "utf8");

  it("requires SCRAM for CForge runtime roles and rejects non-login identities", () => {
    expect(hba).toContain("scram-sha-256");
    expect(hba).toContain("cforge_app,cforge_faculty,cforge_migrator");
    expect(hba).toMatch(/127\.0\.0\.1\/32/);
    expect(hba).toMatch(/::1\/128/);
    expect(hba).toMatch(/^local\s+\/\^cforge/m);
    expect(hba).toContain("cforge,cforge_owner,cforge_student");
    expect(hba).toMatch(/reject/);
    expect(hba).not.toMatch(/^\s*(local|host)\s+all\s+all\s+trust/m);
    expect(hba).not.toMatch(/cforge_app[^\n]*trust/);
    expect(hba).not.toContain("BYPASSRLS");
  });
});
