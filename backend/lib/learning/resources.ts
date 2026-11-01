import { getTopic, officialTopics } from "@/lib/curriculum/catalog";
import { exerciseIdForTopic } from "@/lib/academy/exercise-bank";
import { packageForTopic } from "@/lib/content/registry";
import type { HubCard } from "@/lib/content/types";

export type ResourceAvailability = "AVAILABLE" | "PLANNED" | "UNVERIFIED" | "UNAVAILABLE";

export type ResourceKind =
  | "FOUNDATION"
  | "DEEP_LESSON"
  | "GUIDED_PRACTICE"
  | "INDEPENDENT_PRACTICE"
  | "QUICK_REVISION"
  | "ONE_SHOT"
  | "TOPIC_ASSESSMENT"
  | "UNIT_ASSESSMENT"
  | "DIAGNOSTIC";

const LAB_IDS = new Set(["u1-t8", "u2-t7", "u3-t6", "u4-t6"]);

export function isOfficialLabTopic(topicId: string) {
  return LAB_IDS.has(topicId);
}

export function topicAvailability(topicId: string) {
  const found = getTopic(topicId);
  if (!found) return { lesson: "UNAVAILABLE" as const, notes: "UNAVAILABLE" as const };
  const pkg = packageForTopic(topicId);
  const lab = isOfficialLabTopic(topicId) || Boolean(found.topic.sourceLabel?.includes("Laboratory"));
  const competitive = topicId === "u5-t8";
  const unverified = found.topic.classification === "LEGACY_UNVERIFIED" || found.topic.needsHumanVerification;
  const teaching = Boolean(pkg) && !isOfficialLabTopic(topicId);
  return {
    lesson: teaching ? ("AVAILABLE" as const) : lab || competitive ? ("UNAVAILABLE" as const) : ("PLANNED" as const),
    lessonId: pkg?.lesson.id ?? found.topic.lessonId,
    notes: teaching ? ("AVAILABLE" as const) : ("UNAVAILABLE" as const),
    oneShot: teaching ? ("AVAILABLE" as const) : ("UNAVAILABLE" as const),
    laboratory: lab || competitive ? (unverified ? ("UNVERIFIED" as const) : ("UNAVAILABLE" as const)) : ("UNAVAILABLE" as const),
    practice: practiceFor(topicId, pkg?.practice?.exerciseId),
    diagnostic: teaching && topicId.startsWith("u1-") ? ("AVAILABLE" as const) : ("UNAVAILABLE" as const),
    topicAssessment: teaching ? ("AVAILABLE" as const) : ("UNAVAILABLE" as const),
    unitAssessment: teaching ? ("AVAILABLE" as const) : ("UNAVAILABLE" as const),
    flashcards: teaching ? ("AVAILABLE" as const) : ("UNAVAILABLE" as const),
    visual: teaching ? ("AVAILABLE" as const) : ("UNAVAILABLE" as const),
    unverified,
    lab,
  };
}

function practiceFor(topicId: string, exerciseId?: string): { status: ResourceAvailability; exerciseId?: string } {
  const mapped = exerciseIdForTopic(topicId) ?? exerciseId;
  if (mapped) return { status: "AVAILABLE", exerciseId: mapped };
  if (packageForTopic(topicId) && !isOfficialLabTopic(topicId)) return { status: "AVAILABLE" };
  return { status: "PLANNED" };
}

export function hrefFor(kind: ResourceKind, topicId: string) {
  const avail = topicAvailability(topicId);
  if (kind === "DEEP_LESSON" && avail.lessonId) return `/learn/lessons/${avail.lessonId}`;
  if (kind === "INDEPENDENT_PRACTICE" && avail.practice.exerciseId) return `/studio/${avail.practice.exerciseId}`;
  if (kind === "DIAGNOSTIC") return "/learn/diagnostic";
  if (kind === "FOUNDATION") return "/learn/foundation";
  if (kind === "ONE_SHOT") return `/learn/topics/${topicId}/oneshot`;
  if (kind === "QUICK_REVISION") return `/learn/topics/${topicId}/notes`;
  if (kind === "TOPIC_ASSESSMENT") return `/learn/assessments/topic/${topicId}`;
  if (kind === "UNIT_ASSESSMENT") {
    const unit = packageForTopic(topicId)?.unitId ?? "unit-1";
    return `/learn/assessments/unit/${unit}`;
  }
  return `/learn/topics/${topicId}`;
}

export function hubCards(topicId: string): HubCard[] {
  const avail = topicAvailability(topicId);
  const pkg = packageForTopic(topicId);
  const lessonHref = avail.lessonId ? `/learn/lessons/${avail.lessonId}` : null;
  const base = `/learn/topics/${topicId}`;
  return [
    { type: "deep_lesson", title: "Deep lesson", availability: avail.lesson, href: lessonHref },
    { type: "complete_notes", title: "Complete notes", availability: avail.notes, href: pkg ? `${base}/notes` : null },
    { type: "one_shot", title: "One-shot revision", availability: avail.oneShot, href: pkg ? `${base}/oneshot` : null },
    { type: "mind_map", title: "Mind map", availability: pkg ? "AVAILABLE" : "UNAVAILABLE", href: pkg ? `${base}/mind-map` : null },
    { type: "quick_notes", title: "Quick notes", availability: pkg ? "AVAILABLE" : "UNAVAILABLE", href: pkg ? `${base}/quick` : null },
    { type: "concept_library", title: "Concept library", availability: pkg ? "AVAILABLE" : "UNAVAILABLE", href: pkg ? `${base}/concepts` : null },
    { type: "flashcards", title: "Flashcards", availability: avail.flashcards ?? "UNAVAILABLE", href: pkg ? `${base}/flashcards` : null },
    { type: "worked_examples", title: "Worked examples", availability: pkg ? "AVAILABLE" : "UNAVAILABLE", href: pkg ? `${base}/examples` : null },
    { type: "code_tracing", title: "Code tracing", availability: pkg ? "AVAILABLE" : "UNAVAILABLE", href: pkg ? `${base}/trace` : null },
    { type: "output_prediction", title: "Output prediction", availability: pkg ? "AVAILABLE" : "UNAVAILABLE", href: pkg ? `${base}/predict` : null },
    { type: "syntax_reference", title: "Syntax reference", availability: pkg ? "AVAILABLE" : "UNAVAILABLE", href: pkg ? `${base}/syntax` : null },
    {
      type: "visualisation",
      title: "Interactive tools",
      availability: avail.visual ?? "UNAVAILABLE",
      href: pkg?.visualizerIds[0] ? `/learn/tools/${pkg.visualizerIds[0]}?topic=${topicId}` : null,
    },
    { type: "guided_practice", title: "Guided practice", availability: avail.practice.status, href: `${base}/practice` },
    {
      type: "independent_practice",
      title: "Independent practice",
      availability: avail.practice.status,
      href: avail.practice.exerciseId ? `/studio/${avail.practice.exerciseId}` : `${base}/practice`,
    },
    {
      type: "topic_assessment",
      title: "Topic assessment",
      availability: avail.topicAssessment,
      href: avail.topicAssessment === "AVAILABLE" ? `/learn/assessments/topic/${topicId}` : null,
    },
    { type: "revision", title: "Revision", availability: pkg ? "AVAILABLE" : "UNAVAILABLE", href: pkg ? `${base}/oneshot` : null },
    {
      type: "laboratory",
      title: "Official laboratory",
      availability: avail.laboratory,
      href: "/learn/labs",
      note: "Official experiments stay unavailable until a teacher sheet is uploaded.",
    },
    { type: "related", title: "Related topics", availability: pkg ? "AVAILABLE" : "UNAVAILABLE", href: pkg ? base : null },
  ];
}

export function officialTopicIds() {
  return officialTopics().map((t) => t.id);
}
