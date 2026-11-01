export const OFFICIAL_UNIT_IDS = ["unit-1", "unit-2", "unit-3", "unit-4", "unit-5"] as const;

export type OfficialCurriculum = {
  officialUnitCount: number;
  officialTopicCount: number;
  units: Array<{ id: string; title: string; sourceLabel: string; topicCount: number }>;
  foundationIsOfficialUnit: false;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function field(row: Record<string, unknown>, key: string) {
  return row[key];
}

export function mapOfficialCurriculum(raw: unknown): OfficialCurriculum | null {
  const row = asRecord(raw);
  const unitsRaw = field(row, "units");
  if (!Array.isArray(unitsRaw) || !unitsRaw.length) return null;
  const units = unitsRaw.map((unit) => {
    const entry = asRecord(unit);
    return {
      id: String(field(entry, "id") ?? ""),
      title: String(field(entry, "title") ?? ""),
      sourceLabel: String(field(entry, "sourceLabel") ?? ""),
      topicCount: Number(field(entry, "topicCount") ?? 0),
    };
  }).filter((unit) => unit.id);
  const officialUnitCount = Number(field(row, "officialUnitCount") ?? units.length);
  const officialTopicCount = Number(field(row, "officialTopicCount") ?? units.reduce((sum, unit) => sum + unit.topicCount, 0));
  return {
    officialUnitCount,
    officialTopicCount,
    units,
    foundationIsOfficialUnit: false,
  };
}
