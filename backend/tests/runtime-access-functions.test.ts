import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { acceptInvite, loginStudent, mintInvitation } from "@/lib/academy/onboard";
import { closeSql } from "@/lib/academy/db";
import { resetStore } from "@/lib/academy/store";
import { resetRoster, seedRoster } from "@/lib/roster/store";

describe("2F.8.1 runtime access functions", () => {
  it("does not grant table SELECT on exercise_tests or invitations to cforge_app", () => {
    const sql = readFileSync("db/2026-10-31_012_runtime_access_functions.sql", "utf8");
    expect(sql).toContain("REVOKE SELECT ON TABLE exercise_tests FROM cforge_app");
    expect(sql).toContain("REVOKE SELECT, INSERT, UPDATE ON TABLE invitations FROM cforge_app");
    expect(sql).toContain("GRANT EXECUTE ON FUNCTION academy_login_lookup(text) TO cforge_app");
    expect(sql).not.toMatch(/GRANT EXECUTE ON FUNCTION academy_exercise_tests\(uuid\) TO cforge_faculty/);
    expect(sql).not.toMatch(/GRANT\s+BYPASSRLS/i);
    expect(sql).not.toMatch(/ALTER\s+ROLE[\s\S]*SUPERUSER/i);
    expect(sql).not.toContain("REASSIGN OWNED");
  });

  it("keeps login hash server-side and rejects bad passwords in memory mode", async () => {
    delete process.env.DATABASE_URL;
    await closeSql();
    resetStore();
    resetRoster();
    seedRoster();
    const minted = await mintInvitation("26EG104G10", 1);
    expect(minted.ok).toBe(true);
    if (!minted.ok) return;
    const accepted = await acceptInvite({
      token: minted.token,
      rollIdentifier: "26EG104G10",
      password: "password1234",
    });
    expect(accepted.ok).toBe(true);
    expect(await loginStudent("26EG104G10", "wrong-password")).toBeNull();
    const ok = await loginStudent("26EG104G10", "password1234");
    expect(ok?.rollIdentifier).toBe("26EG104G10");
    expect(ok?.passwordHash).toBeTruthy();
  });
});
