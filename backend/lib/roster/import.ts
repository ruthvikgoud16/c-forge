import { readFileSync } from "node:fs";
import { join } from "node:path";
import { planRosterImport } from "./import-plan.mjs";
import { getRosterRow, markVerifiedRosterLoaded, seedRoster, updateRosterName, verifiedRosterLoaded } from "./store";

export const VERIFIED_ROSTER_FILE = "db/cforge_verified_roster_2026-10-31.csv";

export type RosterImportResult = {
  applied: boolean;
  updated: Array<{ rollNumber: string; previousName: string | null; displayName: string }>;
  unchanged: string[];
  missing: string[];
  rejected: Array<{ rollNumber: string; reason: string; line: number }>;
  uniqueRollCount: number;
};

export function importVerifiedRoster(text: string): RosterImportResult {
  const plan = planRosterImport(text);
  seedRoster();
  if (!plan.valid) {
    return {
      applied: false,
      updated: [],
      unchanged: [],
      missing: plan.missing,
      rejected: plan.rejected,
      uniqueRollCount: plan.uniqueRollCount,
    };
  }

  const updated = [];
  const unchanged = [];
  const missing = [];
  for (const row of plan.rows) {
    const existing = getRosterRow(row.rollNumber);
    if (!existing) {
      missing.push(row.rollNumber);
      continue;
    }
    const name = row.displayName.trim();
    if (!name) continue;
    if (existing.displayName === name) {
      unchanged.push(row.rollNumber);
      continue;
    }
    const previous = existing.displayName;
    const result = updateRosterName(row.rollNumber, name, `roster-import:${row.source || "verified"}`);
    if (!result.ok) continue;
    updated.push({ rollNumber: row.rollNumber, previousName: previous, displayName: name });
  }

  return {
    applied: missing.length === 0,
    updated,
    unchanged,
    missing,
    rejected: [],
    uniqueRollCount: plan.uniqueRollCount,
  };
}

export function readVerifiedRosterCsv() {
  const override = process.env.CFORGE_VERIFIED_ROSTER_PATH?.trim();
  return readFileSync(override || join(process.cwd(), VERIFIED_ROSTER_FILE), "utf8");
}

export function planFromVerifiedFile() {
  return planRosterImport(readVerifiedRosterCsv());
}

/** Idempotent. Loads the verified file into the in-process roster. Does not create accounts. */
export function loadVerifiedRoster() {
  return importVerifiedRoster(readVerifiedRosterCsv());
}

/** Names from the verified CSV only. Never invents names. Does not create accounts. */
export function ensureVerifiedRosterNames() {
  seedRoster();
  if (verifiedRosterLoaded()) return;
  loadVerifiedRoster();
  markVerifiedRosterLoaded();
}
