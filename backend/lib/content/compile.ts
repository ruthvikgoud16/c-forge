import type { LessonDocument } from "@/lib/curriculum/lesson-schema";
import { validateCompleteLesson } from "@/lib/curriculum/lesson-schema";
import type { AssessmentItem, ConceptEntry, Flashcard, TopicPackage, WorkedExample } from "./types";
import type { PlacementMethod } from "@/lib/learning/types";

export type TopicDraft = {
  topicId: string;
  unitId: string;
  lessonId: string;
  title: string;
  sourceLabel: string;
  accuracyNotes?: string[];
  objectives: string[];
  beginner: string;
  formal: string;
  terms: Array<{ term: string; meaning: string }>;
  explanation: string;
  syntax: string;
  analogy: string;
  introduction: string;
  prerequisiteCheck: string;
  examples: WorkedExample[];
  trace: { prompt: string; answer: string };
  predict: { prompt: string; answer: string };
  mistakes: Array<{ wrong: string; why: string }>;
  checks: Array<{ q: string; a: string; family?: string }>;
  guided: { task: string; hint: string };
  independent: { task: string };
  flashcards: Array<{ front: string; back: string }>;
  concepts: Array<{ prompt: string; explanation: string; formal?: string; example?: string }>;
  quickNotes: string[];
  distinctions: string[];
  examShort: string[];
  examLong: string;
  visualizerIds: string[];
  relatedTopicIds: string[];
  assessment: Array<Omit<AssessmentItem, "topicId" | "id"> & { id?: string }>;
  practice?: { exerciseId?: string };
  provenance?: TopicPackage["provenance"];
  officialLab?: boolean;
};

function methodFor(family?: string): PlacementMethod {
  if (family === "trace") return "trace";
  if (family === "predict") return "predict";
  if (family === "debug") return "identify_error";
  if (family === "algorithm") return "algorithm";
  if (family === "syntax") return "identify_error";
  return "concept";
}

export function compileDraft(d: TopicDraft): TopicPackage {
  const lesson: LessonDocument = {
    id: d.lessonId,
    topicId: d.topicId,
    unitId: d.unitId,
    title: d.title,
    classification: "OFFICIAL",
    mode: "learning",
    sourceLabel: d.sourceLabel,
    objectives: d.objectives,
    completionCriteria: [
      "Explain the idea in your own words without copying the page.",
      "Trace or predict at least one example correctly.",
      "Opening this lesson is not mastery.",
    ],
    notes: {
      introduction: d.introduction,
      beginner: d.beginner,
      formal: d.formal,
      terms: d.terms,
      revision: d.quickNotes.slice(0, 6),
      examAnswer: d.examLong,
    },
    mindMap: {
      title: d.title,
      children: [
        { title: "Idea", topicId: d.topicId },
        { title: "Rules", topicId: d.topicId },
        { title: "Examples", topicId: d.topicId },
        ...d.relatedTopicIds.map((id) => ({ title: id, topicId: id })),
      ],
    },
    body: {
      objectives: d.objectives.join(" "),
      prerequisiteCheck: d.prerequisiteCheck,
      introduction: d.introduction,
      analogy: d.analogy,
      explanation: d.explanation,
      syntax: d.syntax,
      visual: { type: "topic", visualizerIds: d.visualizerIds },
      examples: d.examples.map((e) => ({
        title: e.title,
        problem: e.problem,
        steps: e.steps,
        code: e.code,
        output: e.output,
      })),
      execution: d.examples[0]?.steps.join(" ") ?? d.explanation.slice(0, 200),
      trace: d.trace,
      predict: d.predict,
      mistakes: d.mistakes,
      guided: {
        task: d.guided.task,
        hint: d.guided.hint,
        prompt: d.guided.task,
        expected: [] as string[],
        dimension: "concept",
      },
      independent: {
        task: d.independent.task,
        prompt: d.independent.task,
        answer: "",
        dimension: "independent_write",
      },
      check: d.checks.map((c, i) => ({ id: `${d.topicId}-k${i + 1}`, prompt: c.q, answer: c.a })),
      summary: d.quickNotes.join(" "),
      revision: d.quickNotes,
      accuracyNotes: d.accuracyNotes ?? [],
    },
    exerciseId: d.practice?.exerciseId,
  };

  const flashcards: Flashcard[] = d.flashcards.map((c, i) => ({
    id: `${d.topicId}-fc-${i + 1}`,
    front: c.front,
    back: c.back,
    topicId: d.topicId,
  }));
  const concepts: ConceptEntry[] = d.concepts.map((c, i) => ({
    id: `${d.topicId}-c-${i + 1}`,
    prompt: c.prompt,
    explanation: c.explanation,
    formal: c.formal,
    example: c.example,
    topicId: d.topicId,
  }));
  const assessment: AssessmentItem[] = d.assessment.map((item, i) => ({
    ...item,
    id: item.id ?? `${d.topicId}-q${i + 1}`,
    topicId: d.topicId,
    method: item.method ?? methodFor(item.family),
  }));

  return {
    topicId: d.topicId,
    unitId: d.unitId,
    version: "academy-complete-1",
    provenance: d.provenance ?? "cforge_authored",
    officialLab: Boolean(d.officialLab),
    lesson,
    notes: {
      introduction: d.introduction,
      definitions: d.terms,
      explanation: d.explanation,
      syntax: d.syntax,
      distinctions: d.distinctions,
      mistakes: d.mistakes.map((m) => `${m.wrong} — ${m.why}`),
      examShort: d.examShort,
      examLong: d.examLong,
      revision: d.quickNotes,
    },
    oneShot: {
      overview: `${d.title}. Official wording: ${d.sourceLabel}`,
      sequence: ["Why it exists", "Rules and syntax", "Worked example", "Trace", "Mistakes", "Self-check"],
      definitions: d.terms.map((t) => `${t.term}: ${t.meaning}`),
      rules: d.quickNotes,
      walkthrough: d.examples[0] ? `${d.examples[0].title}. ${d.examples[0].steps.join(" ")}` : d.explanation,
      takeaways: d.quickNotes.slice(0, 5),
      endCheck: d.trace,
    },
    quickNotes: d.quickNotes,
    flashcards,
    concepts,
    examples: d.examples,
    syntaxRows: d.terms.slice(0, 8).map((t) => ({ token: t.term, meaning: t.meaning })),
    visualizerIds: d.visualizerIds,
    relatedTopicIds: d.relatedTopicIds,
    assessment,
    practice: { guided: d.guided.task, independent: d.independent.task, exerciseId: d.practice?.exerciseId },
  };
}

export function packageFromExistingLesson(
  lesson: LessonDocument,
  extras: {
    flashcards: Array<{ front: string; back: string }>;
    concepts: Array<{ prompt: string; explanation: string }>;
    distinctions: string[];
    examShort: string[];
    visualizerIds: string[];
    relatedTopicIds: string[];
    assessment: Array<Omit<AssessmentItem, "topicId" | "id"> & { id?: string }>;
    practice?: { exerciseId?: string };
  },
): TopicPackage {
  const notes = lesson.notes;
  const body = lesson.body;
  const explanation = String(notes?.formal ?? "") + "\n\n" + String(body.explanation ?? notes?.beginner ?? "");
  const examples = (body.examples as WorkedExample[]) ?? [];
  const terms = notes?.terms ?? [];
  const trace = body.trace as { prompt: string; answer: string };
  return {
    topicId: lesson.topicId,
    unitId: lesson.unitId,
    version: "academy-complete-1",
    provenance: "existing_lesson",
    officialLab: false,
    lesson,
    notes: {
      introduction: notes?.introduction ?? String(body.introduction ?? ""),
      definitions: terms,
      explanation,
      syntax: String(body.syntax ?? ""),
      distinctions: extras.distinctions,
      mistakes: Array.isArray(body.mistakes)
        ? (body.mistakes as Array<{ wrong?: string; why?: string }>).map((m) => `${m.wrong ?? ""} — ${m.why ?? ""}`)
        : [],
      examShort: extras.examShort,
      examLong: notes?.examAnswer ?? "",
      revision: notes?.revision ?? [],
    },
    oneShot: {
      overview: `${lesson.title}. Official wording: ${lesson.sourceLabel}`,
      sequence: ["Objectives", "Explanation", "Worked example", "Trace", "Mistakes", "Revision"],
      definitions: terms.map((t) => `${t.term}: ${t.meaning}`),
      rules: notes?.revision ?? [],
      walkthrough: examples[0] ? `${examples[0].title}. ${(examples[0].steps ?? []).join(" ")}` : explanation.slice(0, 400),
      takeaways: notes?.revision ?? [],
      endCheck: trace,
    },
    quickNotes: notes?.revision ?? [],
    flashcards: extras.flashcards.map((c, i) => ({
      id: `${lesson.topicId}-fc-${i + 1}`,
      front: c.front,
      back: c.back,
      topicId: lesson.topicId,
    })),
    concepts: extras.concepts.map((c, i) => ({
      id: `${lesson.topicId}-c-${i + 1}`,
      prompt: c.prompt,
      explanation: c.explanation,
      topicId: lesson.topicId,
    })),
    examples,
    syntaxRows: terms.map((t) => ({ token: t.term, meaning: t.meaning })),
    visualizerIds: extras.visualizerIds,
    relatedTopicIds: extras.relatedTopicIds,
    assessment: extras.assessment.map((item, i) => ({
      ...item,
      id: item.id ?? `${lesson.topicId}-q${i + 1}`,
      topicId: lesson.topicId,
    })),
    practice: extras.practice,
  };
}

export function assertDraftQuality(pkg: TopicPackage) {
  const errors = validateCompleteLesson(pkg.lesson);
  if (pkg.flashcards.length < 6) errors.push("need 6 flashcards");
  if (pkg.assessment.length < 4) errors.push("need 4 assessment items");
  const families = new Set(pkg.assessment.map((a) => a.family));
  if (families.size < 2) errors.push("need two assessment families");
  if (pkg.notes.explanation.length < 400) errors.push("notes too thin");
  if (pkg.oneShot.walkthrough.length < 80) errors.push("one-shot too thin");
  return errors;
}
