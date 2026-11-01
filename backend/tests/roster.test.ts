import { describe, expect, it, beforeEach } from "vitest";
import { acceptInvite } from "@/lib/academy/onboard";
import { closeSql } from "@/lib/academy/db";
import { getStore, resetStore } from "@/lib/academy/store";
import { officialRollNumbers, displayLabel, normalizeRoll } from "@/lib/roster/rolls";
import { resetRoster, seedRoster, updateRosterName, getRosterRow } from "@/lib/roster/store";

beforeEach(async () => {
  delete process.env.DATABASE_URL;
  await closeSql();
  resetStore();
  resetRoster();
});

describe("55-student roster", () => {
  it("seeds exactly 55 unique official rolls", () => {
    const rolls = officialRollNumbers();
    expect(rolls).toHaveLength(55);
    expect(rolls[0]).toBe("26EG104G01");
    expect(rolls[50]).toBe("26EG104G51");
    expect(rolls[54]).toBe("26EG104G55");
    expect(new Set(rolls).size).toBe(55);
    const seeded = seedRoster();
    expect(seeded.rows).toHaveLength(55);
    expect(seeded.created).toBe(55);
    expect(seeded.alreadyPresent).toBe(0);
    expect(seeded.updated).toBe(0);
    expect(seeded.rows.every((r) => r.displayName === null)).toBe(true);
  });

  it("is idempotent and does not overwrite a verified name with null", () => {
    seedRoster();
    updateRosterName("26eg104g01", "Verified Student", "faculty");
    expect(getRosterRow("26EG104G01")?.displayName).toBe("Verified Student");
    const again = seedRoster();
    expect(getRosterRow("26EG104G01")?.displayName).toBe("Verified Student");
    expect(again.rows).toHaveLength(55);
    expect(again.alreadyPresent).toBe(55);
  });

  it("does not create student accounts or consume invitations", () => {
    seedRoster();
    expect(getStore().activeCount()).toBe(0);
  });

  it("still requires an invitation for an official roll", async () => {
    const result = await acceptInvite({
      token: "not-a-real-invite",
      rollIdentifier: "26EG104G01",
      password: "password1234",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("invalid_invitation");
  });

  it("falls back to the roll number when the name is pending", () => {
    expect(displayLabel("26eg104g07", null)).toBe("26EG104G07");
    expect(displayLabel("26EG104G07", "Ada")).toBe("Ada");
  });

  it("rejects unknown rolls at invitation accept", async () => {
    const result = await acceptInvite({
      token: "not-a-real-invite",
      rollIdentifier: "OUTSIDER01",
      password: "password1234",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("unknown_roll");
  });

  it("normalizes roll case", () => {
    expect(normalizeRoll("26eg104g09")).toBe("26EG104G09");
  });

  it("keeps the same roster row when a name is added later", () => {
    seedRoster();
    const before = getRosterRow("26EG104G02");
    updateRosterName("26EG104G02", "Later Name", "faculty");
    const after = getRosterRow("26EG104G02");
    expect(before?.rollNumber).toBe(after?.rollNumber);
    expect(after?.displayName).toBe("Later Name");
  });
});
