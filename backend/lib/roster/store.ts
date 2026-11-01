import { officialRollNumbers, normalizeRoll } from "./rolls";

export type RosterRow = {
  rollNumber: string;
  displayName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RosterAudit = {
  rollNumber: string;
  previousName: string | null;
  newName: string | null;
  actor: string;
  createdAt: string;
};

function emptyRoster(): Map<string, RosterRow> {
  return new Map<string, RosterRow>();
}

const g = globalThis as typeof globalThis & {
  __cforgeRoster?: Map<string, RosterRow>;
  __cforgeRosterAudit?: RosterAudit[];
  __cforgeVerifiedRosterLoaded?: boolean;
};

export function verifiedRosterLoaded() {
  return Boolean(g.__cforgeVerifiedRosterLoaded);
}

export function markVerifiedRosterLoaded() {
  g.__cforgeVerifiedRosterLoaded = true;
}

function roster() {
  if (!g.__cforgeRoster) g.__cforgeRoster = emptyRoster();
  return g.__cforgeRoster;
}

function audit() {
  if (!g.__cforgeRosterAudit) g.__cforgeRosterAudit = [];
  return g.__cforgeRosterAudit;
}

export function resetRoster() {
  g.__cforgeRoster = emptyRoster();
  g.__cforgeRosterAudit = [];
  g.__cforgeVerifiedRosterLoaded = false;
}

/** Idempotent: never duplicates rolls; never overwrites a verified name with null. */
export function seedRoster() {
  const now = new Date().toISOString();
  const map = roster();
  let created = 0;
  let alreadyPresent = 0;
  for (const roll of officialRollNumbers()) {
    const existing = map.get(roll);
    if (!existing) {
      map.set(roll, { rollNumber: roll, displayName: null, createdAt: now, updatedAt: now });
      created += 1;
    } else {
      alreadyPresent += 1;
    }
  }
  return {
    rows: [...map.values()].sort((a, b) => a.rollNumber.localeCompare(b.rollNumber)),
    created,
    updated: 0,
    alreadyPresent,
  };
}

export function isApprovedRoll(raw: string) {
  return roster().has(normalizeRoll(raw));
}

export function getRosterRow(raw: string) {
  return roster().get(normalizeRoll(raw)) ?? null;
}

export function listRosterAdmin() {
  return seedRoster().rows;
}

export function updateRosterName(rollNumber: string, displayName: string, actor: string) {
  const roll = normalizeRoll(rollNumber);
  const row = roster().get(roll);
  if (!row) return { ok: false as const, error: "unknown_roll" };
  const name = displayName.trim();
  if (!name) return { ok: false as const, error: "invalid_name" };
  const previous = row.displayName;
  row.displayName = name;
  row.updatedAt = new Date().toISOString();
  audit().push({
    rollNumber: roll,
    previousName: previous,
    newName: name,
    actor,
    createdAt: row.updatedAt,
  });
  return { ok: true as const, row };
}

export function rosterAuditLog() {
  return audit();
}
