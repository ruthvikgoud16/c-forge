export const UNIT1_LESSON_REQUIRED_BODY = [
  "objectives",
  "prerequisiteCheck",
  "introduction",
  "analogy",
  "explanation",
  "syntax",
  "visual",
  "examples",
  "execution",
  "trace",
  "predict",
  "mistakes",
  "guided",
  "independent",
  "check",
  "summary",
  "revision",
] as const;

export type LessonDocument = {
  id: string;
  topicId: string;
  unitId: string;
  title: string;
  classification: string;
  mode: string;
  sourceLabel: string;
  objectives: string[];
  completionCriteria?: string[];
  notes?: {
    introduction?: string;
    beginner?: string;
    formal?: string;
    terms?: Array<{ term: string; meaning: string }>;
    revision?: string[];
    examAnswer?: string;
  };
  mindMap?: { title: string; children: unknown[] };
  body: Record<string, unknown>;
  exerciseId?: string;
};

export function validateCompleteLesson(lesson: LessonDocument, opts?: { requireCompletion?: boolean }) {
  const errors: string[] = [];
  if (!lesson.id || !lesson.topicId || !lesson.sourceLabel) errors.push("missing identity");
  if (!lesson.objectives || lesson.objectives.length < 3) errors.push("need at least 3 objectives");
  if (!lesson.notes?.beginner || lesson.notes.beginner.length < 80) errors.push("notes.beginner too thin");
  if (!lesson.notes?.formal || lesson.notes.formal.length < 40) errors.push("notes.formal missing");
  if (!lesson.notes?.terms || lesson.notes.terms.length < 4) errors.push("need at least 4 terms");
  if (!lesson.notes?.examAnswer) errors.push("examAnswer missing");
  if (!lesson.mindMap?.children?.length) errors.push("mind map empty");
  for (const key of UNIT1_LESSON_REQUIRED_BODY) {
    if (lesson.body[key] == null || lesson.body[key] === "") errors.push(`body.${key} missing`);
  }
  const explanation = String(lesson.body.explanation ?? "");
  if (explanation.length < 400) errors.push("explanation is too short for DEEP teaching");
  const examples = lesson.body.examples as Array<{ title?: string; steps?: string[] }>;
  if (!Array.isArray(examples) || examples.length < 2) errors.push("need at least 2 worked examples");
  if (examples?.some((e) => !e.steps || e.steps.length < 3)) errors.push("an example has fewer than 3 steps");
  const checks = lesson.body.check as unknown[];
  if (!Array.isArray(checks) || checks.length < 3) errors.push("need at least 3 knowledge checks");
  const mistakes = lesson.body.mistakes as unknown[];
  if (!Array.isArray(mistakes) || mistakes.length < 3) errors.push("need at least 3 misconceptions");
  const trace = lesson.body.trace as { prompt?: string; answer?: string };
  const predict = lesson.body.predict as { prompt?: string; answer?: string };
  if (!trace?.prompt || !trace.answer) errors.push("trace answer key missing");
  if (!predict?.prompt || !predict.answer) errors.push("predict answer key missing");
  if (opts?.requireCompletion !== false && (!lesson.completionCriteria || lesson.completionCriteria.length < 2)) {
    errors.push("completionCriteria missing");
  }
  const blob = JSON.stringify(lesson);
  if (/previous-year|PYQ|predicted marks|weightage \d+%/i.test(blob)) {
    errors.push("fabricated exam statistics");
  }
  return errors;
}
