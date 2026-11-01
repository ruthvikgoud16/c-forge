import { describe, expect, it, beforeEach } from "vitest";
import { closeSql } from "@/lib/academy/db";
import { resetStore } from "@/lib/academy/store";
import { ensureVerifiedRosterNames, planFromVerifiedFile } from "@/lib/roster/import";
import { officialRollNumbers } from "@/lib/roster/rolls";
import { getRosterRow, resetRoster, seedRoster } from "@/lib/roster/store";

beforeEach(async () => {
  delete process.env.DATABASE_URL;
  await closeSql();
  resetStore();
  resetRoster();
});

describe("verified official roster CSV", () => {
  it("maps all 55 official rolls to submitted names without inventing accounts", () => {
    const plan = planFromVerifiedFile();
    expect(plan.valid).toBe(true);
    expect(plan.uniqueRollCount).toBe(55);
    expect(plan.missing).toEqual([]);
    expect(plan.rejected).toEqual([]);
    expect(plan.rows.map((row) => row.rollNumber)).toEqual(officialRollNumbers());
    expect(plan.rows.every((row) => row.displayName.trim().length > 0)).toBe(true);
    expect(plan.rows.find((row) => row.rollNumber === "26EG104G45")?.displayName).toBe("Ruthvik Goud");
  });

  it("hydrates in-process roster names from the verified file only", () => {
    seedRoster();
    expect(getRosterRow("26EG104G45")?.displayName).toBeNull();
    ensureVerifiedRosterNames();
    expect(getRosterRow("26EG104G01")?.displayName).toBe("Sandeep");
    expect(getRosterRow("26EG104G45")?.displayName).toBe("Ruthvik Goud");
    expect(getRosterRow("26EG104G55")?.displayName).toBe("Simran");
    expect(seedRoster().rows).toHaveLength(55);
  });
});
