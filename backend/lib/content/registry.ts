import { compileDraft } from "./compile";
import { unit1Packages } from "./drafts/unit1";
import { unit2Drafts } from "./drafts/unit2";
import { unit3Drafts } from "./drafts/unit3";
import { unit4Drafts } from "./drafts/unit4";
import { unit5Drafts } from "./drafts/unit5";
import type { AssessmentItem, TopicPackage } from "./types";

let cache: TopicPackage[] | null = null;

export function allPackages(): TopicPackage[] {
  if (cache) return cache;
  cache = [
    ...unit1Packages(),
    ...unit2Drafts().map(compileDraft),
    ...unit3Drafts().map(compileDraft),
    ...unit4Drafts().map(compileDraft),
    ...unit5Drafts().map(compileDraft),
  ];
  return cache;
}

export function packageForTopic(topicId: string) {
  return allPackages().find((p) => p.topicId === topicId) ?? null;
}

export function packageForLesson(lessonId: string) {
  return allPackages().find((p) => p.lesson.id === lessonId) ?? null;
}

export function teachingTopicIds() {
  return allPackages().map((p) => p.topicId);
}

export function unitAssessmentItems(unitId: string): AssessmentItem[] {
  return allPackages()
    .filter((p) => p.unitId === unitId && !p.officialLab)
    .flatMap((p) => p.assessment.slice(0, 2));
}

export function publicItem(item: AssessmentItem) {
  return {
    id: item.id,
    family: item.family,
    method: item.method,
    prompt: item.prompt,
    choices: item.choices,
    marks: item.marks,
    topicId: item.topicId,
  };
}

/** After submit: marks only. No expected string, no item explanation. */
export function publicReview(
  review: Array<{
    id: string;
    topicId: string;
    family: string;
    correct: boolean;
    marks: number;
    max: number;
    explanation?: string;
    expected?: string;
  }>,
) {
  return review.map(({ id, topicId, family, correct, marks, max }) => ({
    id,
    topicId,
    family,
    correct,
    marks,
    max,
  }));
}

export function normalizeAnswer(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function scoreResponses(items: AssessmentItem[], responses: Record<string, string>) {
  let earned = 0;
  let total = 0;
  const review = items.map((item) => {
    total += item.marks;
    const given = responses[item.id] ?? "";
    const ok = normalizeAnswer(given) === normalizeAnswer(item.answer);
    if (ok) earned += item.marks;
    return {
      id: item.id,
      topicId: item.topicId,
      family: item.family,
      correct: ok,
      marks: ok ? item.marks : 0,
      max: item.marks,
      explanation: item.explanation,
      expected: item.answer,
    };
  });
  const byTopic: Record<string, { earned: number; max: number }> = {};
  for (const row of review) {
    const slot = (byTopic[row.topicId] ??= { earned: 0, max: 0 });
    slot.earned += row.marks;
    slot.max += row.max;
  }
  return { earned, total, review, byTopic };
}
