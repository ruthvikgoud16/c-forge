import type { AssessmentWithQuestions, PreviewResult, Question, QuestionType } from "@/domain/types";

export function topicAssessmentId(topicId: string) {
  return `topic:${topicId}`;
}

export function unitAssessmentId(unitId: string) {
  return `unit:${unitId}`;
}

export function resolveAssessmentId(id: string) {
  if (id.startsWith("ta-")) return topicAssessmentId(id.slice(3));
  if (id.startsWith("ua-")) return unitAssessmentId(id.slice(3));
  return id;
}

export function assessmentIdFromAcademyHref(href: string) {
  const topic = href.match(/^\/learn\/assessments\/topic\/([^/]+)$/);
  if (topic) return topicAssessmentId(topic[1]!);
  const unit = href.match(/^\/learn\/assessments\/unit\/([^/]+)$/);
  if (unit) return unitAssessmentId(unit[1]!);
  return null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function field(row: Record<string, unknown>, key: string) {
  return row[key];
}

function text(value: unknown, fallback = "") {
  return value == null || value === "" ? fallback : String(value);
}

export function questionTypeFor(family: string, choices: string[]): QuestionType {
  if (choices.length > 0) {
    if (family === "predict") return "predict-output";
    const normalized = choices.map((choice) => choice.trim().toLowerCase());
    if (normalized.length === 2 && normalized.includes("true") && normalized.includes("false")) return "true-false";
    return "single-choice";
  }
  return "short-answer";
}

export function mapPublicAssessmentItem(raw: unknown): Question | null {
  const row = asRecord(raw);
  const id = text(field(row, "id"));
  const prompt = text(field(row, "prompt"));
  if (!id || !prompt) return null;
  if (field(row, "answer") != null || field(row, "expected") != null || field(row, "explanation") != null) {
    throw new Error("assessment answer key leaked");
  }
  const choices = field(row, "choices");
  const options = Array.isArray(choices)
    ? choices.map((choice) => ({ id: String(choice), label: String(choice) }))
    : [];
  const family = text(field(row, "family"), "concept");
  return {
    id,
    type: questionTypeFor(family, options.map((option) => option.label)),
    prompt,
    options,
    family,
  };
}

export function mapGraphQuestions(questions: Question[]): Question[] {
  return questions.map((question) => ({
    ...question,
    type: questionTypeFor(question.family ?? question.type, question.options.map((option) => option.label)),
  }));
}

export function mapPublicAssessment(raw: unknown): AssessmentWithQuestions | null {
  const row = asRecord(raw);
  const id = text(field(row, "id"));
  if (!id) return null;
  const items = field(row, "items");
  const questions = Array.isArray(items)
    ? items.map(mapPublicAssessmentItem).filter((item): item is Question => item !== null)
    : [];
  const kind = id.startsWith("unit:") ? "unit" as const : "topic" as const;
  return {
    id,
    kind,
    title: text(field(row, "title"), id),
    scopeId: id.includes(":") ? id.slice(id.indexOf(":") + 1) : id,
    questionCount: questions.length,
    source: "original",
    questions,
  };
}

export function assessmentSubmitRequest(id: string, answers: Record<string, string>) {
  return {
    path: `/api/v1/assessments/${encodeURIComponent(resolveAssessmentId(id))}/submit`,
    payload: { responses: answers },
  };
}

export function mapAssessmentSubmit(id: string, raw: unknown): PreviewResult {
  const row = asRecord(raw);
  const review = field(row, "review");
  const perQuestion = Array.isArray(review)
    ? review.map((item) => {
      const entry = asRecord(item);
      return {
        questionId: text(field(entry, "id")),
        correct: Boolean(field(entry, "correct")),
        correctOptionId: undefined,
      };
    })
    : [];
  return {
    assessmentId: resolveAssessmentId(id),
    correct: Number(field(row, "earned") ?? 0),
    total: Number(field(row, "total") ?? perQuestion.length),
    perQuestion,
    isPreview: false,
  };
}

export function assertNoAssessmentAnswerKey(payload: unknown) {
  const encoded = JSON.stringify(payload);
  if (/"expected"\s*:/.test(encoded)) throw new Error("assessment expected answer leaked");
  if (/"answer"\s*:/.test(encoded) && !/"answerKeysIncluded"\s*:\s*false/.test(encoded)) {
    throw new Error("answer key leaked");
  }
  if (/"correctOptionId"\s*:\s*"[^"]+"/.test(encoded)) throw new Error("correct option leaked");
}
