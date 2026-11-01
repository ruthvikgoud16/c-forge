export const MEMORY_NOTE =
  "Labs and papers are held in the API process memory. They are not a database catalog and they disappear if that process restarts.";

export type QuestionKind = "university_original" | "faculty_extracted" | "cforge_practice";

export type LabResource = {
  id: string;
  unitId: string;
  title: string;
  objective: string | null;
  verified: boolean;
  sourceRef: string;
  sourceHref: string | null;
  uploadedAt: string;
};

export type PaperQuestion = {
  id: string;
  text: string;
  unitHint: string | null;
  topicId: string | null;
  marks: number | null;
  pageRef: string | null;
  kind: QuestionKind;
};

export type PaperResource = {
  id: string;
  academicYear: string;
  semester: string;
  examType: string;
  sourceRef: string;
  sourceHref: string | null;
  verified: boolean;
  uploadedAt: string;
  questions: PaperQuestion[];
};

export type ResourceSource = "demo" | "original";

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

function optionalText(row: Record<string, unknown>, key: string) {
  const value = field(row, key);
  if (value == null || value === "") return null;
  return String(value);
}

export function hrefIfHttp(ref: string) {
  return /^https?:\/\//i.test(ref.trim()) ? ref.trim() : null;
}

const KINDS = new Set<QuestionKind>(["university_original", "faculty_extracted", "cforge_practice"]);

export function mapLab(raw: unknown): LabResource | null {
  const row = asRecord(raw);
  const id = text(row, "id");
  const title = text(row, "title");
  if (!id || !title) return null;
  const sourceRef = text(row, "sourceRef");
  return {
    id,
    unitId: text(row, "unitId"),
    title,
    objective: optionalText(row, "objective"),
    verified: field(row, "verified") === true,
    sourceRef,
    sourceHref: hrefIfHttp(sourceRef),
    uploadedAt: text(row, "uploadedAt"),
  };
}

export function mapPaper(raw: unknown): PaperResource | null {
  const row = asRecord(raw);
  const id = text(row, "id");
  const academicYear = text(row, "academicYear");
  if (!id || !academicYear) return null;
  const sourceRef = text(row, "sourceRef");
  const questions = field(row, "questions");
  return {
    id,
    academicYear,
    semester: text(row, "semester"),
    examType: text(row, "examType"),
    sourceRef,
    sourceHref: hrefIfHttp(sourceRef),
    verified: field(row, "verified") === true,
    uploadedAt: text(row, "uploadedAt"),
    questions: Array.isArray(questions)
      ? questions.map((item) => {
          const q = asRecord(item);
          const kind = field(q, "kind");
          const marks = field(q, "marks");
          return {
            id: text(q, "id"),
            text: text(q, "text"),
            unitHint: optionalText(q, "unitHint"),
            topicId: optionalText(q, "topicId"),
            marks: typeof marks === "number" ? marks : marks == null || marks === "" ? null : Number(marks),
            pageRef: optionalText(q, "pageRef"),
            kind: KINDS.has(kind as QuestionKind) ? (kind as QuestionKind) : "faculty_extracted",
          };
        }).filter((q) => q.text)
      : [],
  };
}

export function mapLabCollection(raw: unknown, source: ResourceSource) {
  const body = asRecord(raw);
  const labs = field(body, "labs");
  return {
    source,
    fabricated: field(body, "fabricated") === true,
    persistence: source === "demo" ? "demo-session" as const : "process-memory" as const,
    labs: Array.isArray(labs) ? labs.map(mapLab).filter((row): row is LabResource => row !== null) : [],
  };
}

export function mapPaperCollection(raw: unknown, source: ResourceSource) {
  const body = asRecord(raw);
  const papers = field(body, "papers");
  return {
    source,
    fabricated: field(body, "fabricated") === true,
    persistence: source === "demo" ? "demo-session" as const : "process-memory" as const,
    papers: Array.isArray(papers) ? papers.map(mapPaper).filter((row): row is PaperResource => row !== null) : [],
  };
}

export type LabIngestInput = {
  unitId: string;
  title: string;
  sourceRef: string;
  objective?: string;
};

export type PaperQuestionInput = {
  text: string;
  topicId?: string;
  marks?: string;
  pageRef?: string;
};

export type PaperIngestInput = {
  academicYear: string;
  sourceRef: string;
  semester?: string;
  examType?: string;
  questions: PaperQuestionInput[];
};

export function labIngestPayload(input: LabIngestInput) {
  const unitId = input.unitId.trim();
  const title = input.title.trim();
  const sourceRef = input.sourceRef.trim();
  const objective = input.objective?.trim();
  if (!unitId || !title || !sourceRef) {
    return { ok: false as const, error: "Unit id, title, and source reference are required." };
  }
  return {
    ok: true as const,
    body: {
      unitId,
      title,
      sourceRef,
      ...(objective ? { objective } : {}),
    },
  };
}

export function paperIngestPayload(input: PaperIngestInput) {
  const academicYear = input.academicYear.trim();
  const sourceRef = input.sourceRef.trim();
  const questions = input.questions
    .map((q) => ({
      text: q.text.trim(),
      ...(q.topicId?.trim() ? { topicId: q.topicId.trim() } : {}),
      ...(q.pageRef?.trim() ? { pageRef: q.pageRef.trim() } : {}),
      ...(q.marks?.trim() && Number.isFinite(Number(q.marks)) ? { marks: Number(q.marks) } : {}),
    }))
    .filter((q) => q.text);
  if (!academicYear || !sourceRef || questions.length === 0) {
    return { ok: false as const, error: "Academic year, source reference, and at least one question text are required." };
  }
  return {
    ok: true as const,
    body: {
      academicYear,
      sourceRef,
      semester: input.semester?.trim() ?? "",
      examType: input.examType?.trim() ?? "",
      questions,
    },
  };
}

export function matchesQuery(haystack: string, query: string) {
  if (!query.trim()) return true;
  return haystack.toLowerCase().includes(query.trim().toLowerCase());
}
