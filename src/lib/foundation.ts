export type FoundationClassification = "OFFICIAL" | "SUPPORTING" | "EXTENSION" | "LEGACY_UNVERIFIED";

export type FoundationTopic = {
  id: string;
  title: string;
  classification: FoundationClassification;
  sourceLabels: string[];
  needsHumanVerification: boolean;
  accuracyNotes: string[];
  lessonId: string | null;
  hasLessonBody: boolean;
};

export type FoundationLibrary = {
  source: "demo" | "original";
  available: boolean;
  id: string;
  title: string;
  sourceLabel: string;
  sourceNote: string;
  notAnOfficialUnit: true;
  missingEntryCount: number;
  topics: FoundationTopic[];
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function field(row: Record<string, unknown>, key: string) {
  return row[key];
}

function text(row: Record<string, unknown>, key: string, fallback = "") {
  const value = field(row, key);
  return value == null ? fallback : String(value);
}

const CLASSIFICATIONS = new Set<FoundationClassification>([
  "OFFICIAL",
  "SUPPORTING",
  "EXTENSION",
  "LEGACY_UNVERIFIED",
]);

function classificationOf(value: unknown): FoundationClassification {
  return CLASSIFICATIONS.has(value as FoundationClassification) ? (value as FoundationClassification) : "SUPPORTING";
}

export function mapFoundationTopic(raw: unknown): FoundationTopic {
  const item = asRecord(raw);
  const lessonId = typeof field(item, "lessonId") === "string" && text(item, "lessonId")
    ? text(item, "lessonId")
    : null;
  const labels = field(item, "sourceLabels");
  const single = field(item, "sourceLabel");
  const notes = field(item, "accuracyNotes");
  return {
    id: text(item, "id"),
    title: text(item, "title"),
    classification: classificationOf(field(item, "classification")),
    sourceLabels: Array.isArray(labels)
      ? labels.map(String)
      : typeof single === "string" && single
        ? [single]
        : [],
    needsHumanVerification: field(item, "needsHumanVerification") === true,
    accuracyNotes: Array.isArray(notes) ? notes.map(String) : [],
    lessonId,
    hasLessonBody: Boolean(lessonId),
  };
}

export function mapFoundationLibrary(raw: Record<string, unknown>, source: "demo" | "original"): FoundationLibrary {
  const topics = field(raw, "topics");
  return {
    source,
    available: source === "original",
    id: text(raw, "id", "foundation"),
    title: text(raw, "title"),
    sourceLabel: text(raw, "sourceLabel"),
    sourceNote: text(raw, "sourceNote"),
    notAnOfficialUnit: true,
    missingEntryCount: Number(field(raw, "missingEntryCount") ?? 0),
    topics: Array.isArray(topics) ? topics.map(mapFoundationTopic).filter((topic) => topic.id && topic.title) : [],
  };
}

export function findFoundationTopic(library: FoundationLibrary, id: string) {
  return library.topics.find((topic) => topic.id === id) ?? null;
}

export function demoFoundationLibrary(): FoundationLibrary {
  return {
    source: "demo",
    available: false,
    id: "foundation",
    title: "Foundation catalog",
    sourceLabel: "",
    sourceNote: "Demo mode does not load the original foundation catalog. No lesson bodies are invented.",
    notAnOfficialUnit: true,
    missingEntryCount: 0,
    topics: [],
  };
}

export function classificationLabel(value: FoundationClassification) {
  if (value === "LEGACY_UNVERIFIED") return "Needs verification";
  if (value === "EXTENSION") return "Extension";
  if (value === "OFFICIAL") return "Official";
  return "Supporting";
}
