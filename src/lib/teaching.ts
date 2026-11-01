import type { ContentSource } from "@/domain/types";
import type { EmergentDest } from "@/lib/adaptive";

export const ORIGINAL_TEACHING_KINDS = [
  "notes",
  "oneshot",
  "mind-map",
  "quick",
  "concepts",
  "flashcards",
  "examples",
  "trace",
  "predict",
  "syntax",
  "practice",
] as const;

export type TeachingKind = (typeof ORIGINAL_TEACHING_KINDS)[number];

export const ALREADY_INTEGRATED_KINDS = ["notes", "oneshot", "mind-map", "flashcards"] as const;
export const NEWLY_INTEGRATED_KINDS = ["quick", "concepts", "examples", "trace", "predict", "syntax", "practice"] as const;

export const LESSON_CHECK_SLOTS = ["trace", "predict", "guided", "independent", "check"] as const;
export type LessonCheckSlot = (typeof LESSON_CHECK_SLOTS)[number];

export type HubAvailability = "AVAILABLE" | "PLANNED" | "UNVERIFIED" | "UNAVAILABLE";

export type TeachingHubCard = {
  type: string;
  title: string;
  availability: HubAvailability;
  kind: TeachingKind | null;
  href: string | null;
  dest: EmergentDest | null;
  note?: string;
};

export type WorkedExample = {
  title: string;
  problem: string | null;
  steps: string[];
  code: string | null;
  output: string | null;
};

export type ConceptCard = { id: string; prompt: string; explanation: string };
export type SyntaxRow = { token: string; meaning: string };
export type CheckItem = {
  id: string;
  kind: "mcq" | "short";
  prompt: string;
  choices: string[] | null;
  dimension: string | null;
};

export type SlotPrompt = {
  slot: Exclude<LessonCheckSlot, "check">;
  prompt: string;
  hint: string | null;
};

export type TeachingPackage = {
  topicId: string;
  lessonId: string | null;
  source: ContentSource;
  openedIsNotMastery: true;
  scoresAreSeparate: true;
  placement: unknown;
  mastery: unknown;
  quickNotes: string[];
  concepts: ConceptCard[];
  examples: WorkedExample[];
  syntax: string | null;
  syntaxRows: SyntaxRow[];
  trace: SlotPrompt | null;
  predict: SlotPrompt | null;
  guided: SlotPrompt | null;
  independent: SlotPrompt | null;
  checks: CheckItem[];
  exerciseId: string | null;
  availableKinds: TeachingKind[];
  missingKinds: TeachingKind[];
};

export type LessonCheckRequest = { lessonId: string; slot: LessonCheckSlot; value: unknown; itemId?: string };

export type LessonCheckResult = {
  ok: true;
  correct: boolean;
  itemId: string | null;
  unscored: boolean;
  answerKeysIncluded: false;
  demo: boolean;
};

export type LessonCheckFailure = {
  ok: false;
  error: "invalid_slot" | "invalid_body" | "unknown_item" | "not_found" | "session_expired" | "demo_unscored" | "persist_failed" | "request_failed";
  status?: number;
};

const HUB_TYPE_TO_KIND: Record<string, TeachingKind | null> = {
  complete_notes: "notes",
  one_shot: "oneshot",
  mind_map: "mind-map",
  quick_notes: "quick",
  concept_library: "concepts",
  flashcards: "flashcards",
  worked_examples: "examples",
  code_tracing: "trace",
  output_prediction: "predict",
  syntax_reference: "syntax",
  guided_practice: "practice",
  independent_practice: "practice",
  revision: "oneshot",
  deep_lesson: null,
  visualisation: null,
  topic_assessment: null,
  laboratory: null,
  related: null,
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function field(row: Record<string, unknown>, key: string) {
  return row[key];
}

function text(value: unknown, fallback = "") {
  return value == null || value === "" ? fallback : String(value);
}

function fieldText(row: Record<string, unknown>, key: string, fallback = "") {
  return text(field(row, key), fallback);
}

function stripHidden(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripHidden);
  if (!value || typeof value !== "object") return value;
  const copy: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (key === "answer" || key === "expected" || key === "explanation" || key === "expectedStdout") continue;
    copy[key] = stripHidden(entry);
  }
  return copy;
}

export function isTeachingKind(value: string): value is TeachingKind {
  return (ORIGINAL_TEACHING_KINDS as readonly string[]).includes(value);
}

export function destForTeachingKind(topicId: string, kind: TeachingKind): EmergentDest {
  if (kind === "notes") return { to: "/learn/topics/$topicId/notes", params: { topicId } };
  if (kind === "oneshot") return { to: "/learn/topics/$topicId/resources", params: { topicId } };
  if (kind === "mind-map") return { to: "/learn/topics/$topicId/mind-map", params: { topicId } };
  if (kind === "flashcards") return { to: "/learn/topics/$topicId/flashcards", params: { topicId } };
  return { to: "/learn/topics/$topicId/$kind", params: { topicId, kind } };
}

export function destLink(dest: EmergentDest) {
  return {
    to: dest.to,
    params: "params" in dest ? dest.params : {},
  };
}

export function lessonIdFromHref(href: string | null | undefined) {
  const match = String(href ?? "").match(/\/learn\/lessons\/([^/#?]+)/);
  return match?.[1] ?? null;
}

export function mapHubCard(raw: unknown): TeachingHubCard | null {
  const row = asRecord(raw);
  const type = fieldText(row, "type");
  if (!type) return null;
  const availability = (fieldText(row, "availability", "UNAVAILABLE") || "UNAVAILABLE") as HubAvailability;
  const hrefValue = field(row, "href");
  const href = typeof hrefValue === "string" ? hrefValue : null;
  const kind = HUB_TYPE_TO_KIND[type] ?? null;
  const topicMatch = href?.match(/\/learn\/topics\/([^/]+)/);
  const dest = kind && topicMatch ? destForTeachingKind(topicMatch[1]!, kind) : null;
  const note = field(row, "note");
  return {
    type,
    title: fieldText(row, "title", type),
    availability,
    kind,
    href,
    dest: availability === "AVAILABLE" ? dest : null,
    ...(typeof note === "string" ? { note } : {}),
  };
}

export function mapTopicHub(raw: unknown) {
  const row = asRecord(raw);
  const topic = asRecord(field(row, "topic"));
  const resources = field(row, "resources");
  const cards = (Array.isArray(resources) ? resources : []).map(mapHubCard).filter((card): card is TeachingHubCard => card !== null);
  const deep = cards.find((card) => card.type === "deep_lesson");
  return {
    topicId: fieldText(topic, "id"),
    lessonId: lessonIdFromHref(deep?.href),
    placement: field(row, "placement") ?? null,
    mastery: field(row, "mastery") ?? null,
    lessonsRemainAccessible: field(row, "lessonsRemainAccessible") !== false,
    cards,
  };
}

function asStringList(value: unknown) {
  return Array.isArray(value) ? value.map((item) => text(item)).filter(Boolean) : [];
}

function mapExample(raw: unknown): WorkedExample | null {
  const row = asRecord(raw);
  const title = fieldText(row, "title");
  const steps = asStringList(field(row, "steps"));
  if (!title && !steps.length && !field(row, "code")) return null;
  return {
    title: title || "Worked example",
    problem: fieldText(row, "problem") || null,
    steps,
    code: fieldText(row, "code") || null,
    output: fieldText(row, "output") || null,
  };
}

function mapCheckItem(raw: unknown): CheckItem | null {
  const row = asRecord(stripHidden(raw));
  const id = fieldText(row, "id");
  const prompt = fieldText(row, "prompt");
  if (!id || !prompt) return null;
  const choices = field(row, "choices");
  return {
    id,
    kind: field(row, "kind") === "mcq" ? "mcq" : "short",
    prompt,
    choices: Array.isArray(choices) ? choices.map((choice) => text(choice)) : null,
    dimension: fieldText(row, "dimension") || null,
  };
}

function mapSlot(slot: SlotPrompt["slot"], raw: unknown): SlotPrompt | null {
  const row = asRecord(stripHidden(raw));
  const prompt = fieldText(row, "prompt") || fieldText(row, "task");
  if (!prompt) return null;
  return { slot, prompt, hint: fieldText(row, "hint") || null };
}

export function mapPublicLesson(raw: unknown) {
  const root = asRecord(raw);
  const lessonField = field(root, "lesson");
  const lesson = asRecord(lessonField && typeof lessonField === "object" ? lessonField : raw);
  const body = asRecord(stripHidden(field(lesson, "body")));
  const notes = asRecord(field(lesson, "notes"));
  const terms = field(notes, "terms");
  const termList = Array.isArray(terms) ? terms : [];
  const revision = asStringList(field(notes, "revision")).length
    ? asStringList(field(notes, "revision"))
    : asStringList(field(body, "revision"));
  const examplesRaw = field(body, "examples");
  const examples = Array.isArray(examplesRaw)
    ? examplesRaw.map(mapExample).filter((item): item is WorkedExample => item !== null)
    : [];
  const checkRaw = field(body, "check");
  const checks = Array.isArray(checkRaw)
    ? checkRaw.map(mapCheckItem).filter((item): item is CheckItem => item !== null)
    : [];
  const syntaxRows = termList.map((term) => {
    const row = asRecord(term);
    return { token: fieldText(row, "term"), meaning: fieldText(row, "meaning") };
  }).filter((row) => row.token);
  return {
    lessonId: fieldText(lesson, "id") || null,
    topicId: fieldText(lesson, "topicId"),
    title: fieldText(lesson, "title"),
    openedIsNotMastery: true as const,
    placement: field(root, "placement") ?? null,
    mastery: field(root, "topicState") ?? field(root, "mastery") ?? null,
    quickNotes: revision,
    examples,
    syntax: fieldText(body, "syntax") || null,
    syntaxRows,
    trace: mapSlot("trace", field(body, "trace")),
    predict: mapSlot("predict", field(body, "predict")),
    guided: mapSlot("guided", field(body, "guided")),
    independent: mapSlot("independent", field(body, "independent")),
    checks,
    exerciseId: fieldText(lesson, "exerciseId") || null,
    answerKeysIncluded: false as const,
  };
}

export function mergeTeachingPackage(input: {
  topicId: string;
  source: ContentSource;
  hub?: ReturnType<typeof mapTopicHub> | null;
  publicLesson?: ReturnType<typeof mapPublicLesson> | null;
  graphConcepts?: Array<{ term?: string; definition?: string; prompt?: string; explanation?: string }>;
  alwaysPresent?: TeachingKind[];
}): TeachingPackage {
  const lesson = input.publicLesson;
  const conceptsFromGraph = (input.graphConcepts ?? []).map((row, index) => ({
    id: `${input.topicId}-c-${index + 1}`,
    prompt: text(row.prompt) || text(row.term),
    explanation: text(row.explanation) || text(row.definition),
  })).filter((row) => row.prompt && row.explanation);
  const conceptsFromTerms = (lesson?.syntaxRows ?? []).map((row, index) => ({
    id: `${input.topicId}-term-${index + 1}`,
    prompt: row.token,
    explanation: row.meaning,
  }));
  const concepts = conceptsFromGraph.length ? conceptsFromGraph : conceptsFromTerms;
  const present = new Set<TeachingKind>(input.alwaysPresent ?? []);
  if (lesson?.quickNotes.length) present.add("quick");
  if (conceptsFromGraph.length || concepts.length) present.add("concepts");
  if (lesson?.examples.length) present.add("examples");
  if (lesson?.trace) present.add("trace");
  if (lesson?.predict) present.add("predict");
  if (lesson?.syntax || lesson?.syntaxRows.length) present.add("syntax");
  if (lesson?.guided || lesson?.independent || lesson?.checks.length) present.add("practice");

  const hubAvailable = new Set(
    (input.hub?.cards ?? [])
      .filter((card) => card.availability === "AVAILABLE" && card.kind)
      .map((card) => card.kind as TeachingKind),
  );
  const availableKinds = ORIGINAL_TEACHING_KINDS.filter((kind) => {
    if ((ALREADY_INTEGRATED_KINDS as readonly string[]).includes(kind)) {
      return hubAvailable.has(kind) || present.has(kind);
    }
    return present.has(kind);
  });

  return {
    topicId: input.topicId,
    lessonId: lesson?.lessonId ?? input.hub?.lessonId ?? null,
    source: input.source,
    openedIsNotMastery: true,
    scoresAreSeparate: true,
    placement: lesson?.placement ?? input.hub?.placement ?? null,
    mastery: lesson?.mastery ?? input.hub?.mastery ?? null,
    quickNotes: lesson?.quickNotes ?? [],
    concepts: conceptsFromGraph.length ? conceptsFromGraph : concepts,
    examples: lesson?.examples ?? [],
    syntax: lesson?.syntax ?? null,
    syntaxRows: lesson?.syntaxRows ?? [],
    trace: lesson?.trace ?? null,
    predict: lesson?.predict ?? null,
    guided: lesson?.guided ?? null,
    independent: lesson?.independent ?? null,
    checks: lesson?.checks ?? [],
    exerciseId: lesson?.exerciseId ?? null,
    availableKinds,
    missingKinds: ORIGINAL_TEACHING_KINDS.filter((kind) => !availableKinds.includes(kind)),
  };
}

export function teachingContentForKind(pkg: TeachingPackage, kind: TeachingKind) {
  if (kind === "quick") return pkg.quickNotes.length > 0;
  if (kind === "concepts") return pkg.concepts.length > 0;
  if (kind === "examples") return pkg.examples.length > 0;
  if (kind === "trace") return Boolean(pkg.trace);
  if (kind === "predict") return Boolean(pkg.predict);
  if (kind === "syntax") return Boolean(pkg.syntax || pkg.syntaxRows.length);
  if (kind === "practice") return Boolean(pkg.guided || pkg.independent || pkg.checks.length);
  return pkg.availableKinds.includes(kind);
}

export function lessonCheckRequest(input: LessonCheckRequest) {
  if (!LESSON_CHECK_SLOTS.includes(input.slot)) {
    return { ok: false as const, error: "invalid_slot" as const };
  }
  if (!input.lessonId) return { ok: false as const, error: "not_found" as const };
  const payload: Record<string, unknown> = { slot: input.slot, value: input.value };
  if (input.itemId) payload["itemId"] = input.itemId;
  return { ok: true as const, path: `/api/v1/curriculum/lessons/${encodeURIComponent(input.lessonId)}/check`, payload };
}

export function mapLessonCheckResponse(body: unknown): LessonCheckResult {
  const row = asRecord(body);
  return {
    ok: true,
    correct: Boolean(field(row, "correct")),
    itemId: field(row, "itemId") == null ? null : String(field(row, "itemId")),
    unscored: Boolean(field(row, "unscored")),
    answerKeysIncluded: false,
    demo: false,
  };
}

export function mapLessonCheckError(status: number, body: unknown): LessonCheckFailure {
  const error = fieldText(asRecord(body), "error");
  if (status === 401 || error === "unauthorized") return { ok: false, error: "session_expired", status };
  if (error === "invalid_slot") return { ok: false, error: "invalid_slot", status };
  if (error === "invalid_body") return { ok: false, error: "invalid_body", status };
  if (error === "unknown_item") return { ok: false, error: "unknown_item", status };
  if (status === 404 || error === "not_found") return { ok: false, error: "not_found", status };
  if (status === 503 || error === "LEARNING_PERSIST_FAILED") return { ok: false, error: "persist_failed", status };
  return { ok: false, error: "request_failed", status };
}

export function checkResultMessage(result: LessonCheckResult) {
  if (result.unscored) return "Recorded without a score. The original lesson has no expected answer for this slot.";
  return result.correct ? "The original checker marked this correct." : "The original checker marked this not yet correct.";
}

export function assertNoTeachingAnswerKey(payload: unknown) {
  const textPayload = JSON.stringify(payload);
  if (/"expectedStdout"\s*:/.test(textPayload)) throw new Error("hidden test field leaked");
  if (/"expected"\s*:/.test(textPayload)) throw new Error("assessment expected answer leaked");
  if (/"answer"\s*:/.test(textPayload) && !/"answerKeysIncluded"\s*:\s*false/.test(textPayload)) {
    throw new Error("answer key leaked");
  }
  if (/"explanation"\s*:/.test(textPayload) && /"review"\s*:/.test(textPayload)) {
    throw new Error("assessment explanation leaked");
  }
}

export function publicCheckPayload(payload: LessonCheckResult | LessonCheckFailure) {
  const copy = { ...payload };
  assertNoTeachingAnswerKey(copy);
  return copy;
}
