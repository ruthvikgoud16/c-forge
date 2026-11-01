import { officialUnits } from "@/lib/curriculum/catalog";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CURRICULUM_VERSION,
  PLACEMENT_RULES_VERSION,
  type PlacementMethod,
} from "./types";

export type BankItem = {
  id: string;
  topicId: string;
  lessonId: string;
  method: PlacementMethod;
  kind: "mcq" | "short";
  prompt: string;
  choices?: string[];
  answer: string | number;
  dimension: string;
  curriculumVersion: string;
  rubricVersion: string;
};

type LessonFile = {
  id: string;
  topicId: string;
  body?: {
    trace?: { prompt?: string; answer?: string; dimension?: string };
    predict?: { prompt?: string; answer?: string; dimension?: string };
    independent?: { prompt?: string; answer?: string; dimension?: string };
    check?: Array<{
      id?: string;
      kind?: string;
      dimension?: string;
      prompt?: string;
      choices?: string[];
      answer?: string | number;
    }>;
  };
};

let cached: BankItem[] | null = null;

function methodFor(dimension: string | undefined, kind: string | undefined): PlacementMethod {
  if (dimension === "trace") return "trace";
  if (dimension === "predict") return "predict";
  if (dimension === "independent_write") return "independent_write";
  if (dimension === "syntax" && kind === "short") return "definition";
  if (kind === "mcq") return "mcq";
  if (dimension === "concept") return "concept";
  return "concept";
}

export function loadDiagnosticBank(): BankItem[] {
  if (cached) return cached;
  const items: BankItem[] = [];
  for (const unit of officialUnits()) {
    for (const topic of unit.topics) {
      if (!topic.lessonId) continue;
      let lesson: LessonFile;
      try {
        lesson = JSON.parse(
          readFileSync(join(process.cwd(), "content/curriculum/lessons", `${topic.lessonId}.json`), "utf8"),
        ) as LessonFile;
      } catch {
        continue;
      }
      const body = lesson.body ?? {};
      if (body.trace?.prompt && body.trace.answer) {
        items.push({
          id: `${lesson.id}:trace`,
          topicId: lesson.topicId,
          lessonId: lesson.id,
          method: "trace",
          kind: "short",
          prompt: body.trace.prompt,
          answer: body.trace.answer,
          dimension: body.trace.dimension ?? "trace",
          curriculumVersion: CURRICULUM_VERSION,
          rubricVersion: PLACEMENT_RULES_VERSION,
        });
      }
      if (body.predict?.prompt && body.predict.answer) {
        items.push({
          id: `${lesson.id}:predict`,
          topicId: lesson.topicId,
          lessonId: lesson.id,
          method: "predict",
          kind: "short",
          prompt: body.predict.prompt,
          answer: body.predict.answer,
          dimension: body.predict.dimension ?? "predict",
          curriculumVersion: CURRICULUM_VERSION,
          rubricVersion: PLACEMENT_RULES_VERSION,
        });
      }
      if (body.independent?.prompt && body.independent.answer) {
        items.push({
          id: `${lesson.id}:independent`,
          topicId: lesson.topicId,
          lessonId: lesson.id,
          method: body.independent.dimension === "independent_write" ? "algorithm" : "algorithm",
          kind: "short",
          prompt: body.independent.prompt,
          answer: body.independent.answer,
          dimension: body.independent.dimension ?? "independent_write",
          curriculumVersion: CURRICULUM_VERSION,
          rubricVersion: PLACEMENT_RULES_VERSION,
        });
      }
      for (const check of body.check ?? []) {
        if (!check.prompt || check.answer === undefined) continue;
        items.push({
          id: `${lesson.id}:check:${check.id ?? items.length}`,
          topicId: lesson.topicId,
          lessonId: lesson.id,
          method: methodFor(check.dimension, check.kind),
          kind: check.kind === "mcq" ? "mcq" : "short",
          prompt: check.prompt,
          choices: check.choices,
          answer: check.answer,
          dimension: check.dimension ?? "concept",
          curriculumVersion: CURRICULUM_VERSION,
          rubricVersion: PLACEMENT_RULES_VERSION,
        });
      }
    }
  }
  cached = items;
  return items;
}

export function publicItem(item: BankItem) {
  return {
    id: item.id,
    topicId: item.topicId,
    method: item.method,
    kind: item.kind,
    prompt: item.prompt,
    choices: item.choices,
    dimension: item.dimension,
  };
}

export function normalizeAnswer(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/^the\s+/, "")
    .replace(/[.]+$/, "")
    .replace(/\s+/g, " ");
}

export function gradeItem(item: BankItem, value: unknown) {
  if (item.kind === "mcq") {
    return Number(value) === Number(item.answer);
  }
  return normalizeAnswer(value) === normalizeAnswer(item.answer);
}

export const METHOD_FAMILY: Record<PlacementMethod, string> = {
  mcq: "recognition",
  concept: "recognition",
  definition: "recognition",
  trace: "trace",
  predict: "predict",
  identify_error: "identify_error",
  algorithm: "construct",
  independent_write: "construct",
};

export function methodFamily(method: PlacementMethod) {
  return METHOD_FAMILY[method];
}

/** Two items per topic from different cognitive families, existing lesson items only. */
export function selectDiagnosticItems() {
  const bank = loadDiagnosticBank();
  const chosen: BankItem[] = [];
  const topics = [...new Set(bank.map((i) => i.topicId))];
  for (const topicId of topics) {
    const pool = bank.filter((i) => i.topicId === topicId);
    const byFamily = new Map<string, BankItem>();
    for (const item of pool) {
      const family = methodFamily(item.method);
      if (!byFamily.has(family)) byFamily.set(family, item);
    }
    const families = [...byFamily.keys()].slice(0, 2);
    for (const family of families) {
      chosen.push(byFamily.get(family)!);
    }
  }
  return chosen;
}

export function familiesForTopic(topicId: string) {
  const items = selectDiagnosticItems().filter((i) => i.topicId === topicId);
  return new Set(items.map((i) => methodFamily(i.method)));
}
