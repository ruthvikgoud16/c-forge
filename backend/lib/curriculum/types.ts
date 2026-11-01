export const CLASSIFICATIONS = ["OFFICIAL", "SUPPORTING", "EXTENSION", "LEGACY_UNVERIFIED"] as const;
export type Classification = (typeof CLASSIFICATIONS)[number];

export const LESSON_SECTIONS = [
  "objectives",
  "explanation",
  "analogy",
  "syntax",
  "examples",
  "visual",
  "execution",
  "trace",
  "predict",
  "mistakes",
  "guided",
  "independent",
  "check",
  "revision",
] as const;

export type LessonSection = (typeof LESSON_SECTIONS)[number];

export type LessonBody = Partial<Record<LessonSection, unknown>>;

export type SyllabusMapping = {
  status: "pending" | "extracted" | "verified";
  source: {
    type: string;
    filename: string | null;
    sha256: string | null;
    received: boolean;
  };
  officialUnits: unknown[];
  officialTopics: unknown[];
  practicals: unknown[];
  examNotes: unknown[];
  unverified: unknown[];
  notes: string[];
};
