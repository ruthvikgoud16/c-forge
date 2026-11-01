export const ROSTER_PREFIX = "26EG104G";
export const COHORT_CAPACITY = 55;

export function officialRollNumbers(): string[] {
  return Array.from({ length: COHORT_CAPACITY }, (_, i) => `${ROSTER_PREFIX}${String(i + 1).padStart(2, "0")}`);
}

export function normalizeRoll(raw: string) {
  return raw.trim().toUpperCase();
}

export function isOfficialRoll(raw: string) {
  return officialRollNumbers().includes(normalizeRoll(raw));
}

export function displayLabel(rollNumber: string, displayName: string | null | undefined) {
  const name = displayName?.trim();
  return name ? name : normalizeRoll(rollNumber);
}
