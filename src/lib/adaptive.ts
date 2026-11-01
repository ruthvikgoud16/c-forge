import type { PlacementState, StartIntent } from "@/domain/types";
import { resolveAssessmentId } from "@/lib/assessment";

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

export type ResourceAvailability = "AVAILABLE" | "PLANNED" | "UNVERIFIED" | "UNAVAILABLE";

export type MasteryRecord = "started" | "practised" | "assessment_passed" | "mastered" | null;

export type EmergentDest =
  | { to: "/learn/topics/$topicId/lesson"; params: { topicId: string } }
  | { to: "/learn/topics/$topicId"; params: { topicId: string } }
  | { to: "/learn/topics/$topicId/notes"; params: { topicId: string } }
  | { to: "/learn/topics/$topicId/resources"; params: { topicId: string } }
  | { to: "/learn/topics/$topicId/flashcards"; params: { topicId: string } }
  | { to: "/learn/topics/$topicId/mind-map"; params: { topicId: string } }
  | { to: "/learn/topics/$topicId/$kind"; params: { topicId: string; kind: string } }
  | { to: "/studio/$exerciseId"; params: { exerciseId: string } }
  | { to: "/learn/diagnostic" }
  | { to: "/learn/onboarding" }
  | { to: "/learn/foundation" }
  | { to: "/learn/foundation/$topicId"; params: { topicId: string } }
  | { to: "/learn/assessments/$assessmentId"; params: { assessmentId: string } }
  | { to: "/learn/units/$unitId"; params: { unitId: string } }
  | { to: "/learn/labs" }
  | { to: "/learn/papers" }
  | { to: "/learn/progress" }
  | { to: "/learn/revision" }
  | { to: "/learn/path" };

export function destFromAcademyHref(href: string | null | undefined, topicId?: string): EmergentDest | null {
  if (!href) return null;
  if (href === "/learn/diagnostic") return { to: "/learn/diagnostic" };
  if (href === "/learn/onboarding") return { to: "/learn/onboarding" };
  if (href === "/learn/foundation") return { to: "/learn/foundation" };
  if (href === "/learn/labs") return { to: "/learn/labs" };
  if (href === "/learn/papers") return { to: "/learn/papers" };
  if (href === "/learn/progress") return { to: "/learn/progress" };
  if (href === "/learn/revision") return { to: "/learn/revision" };
  if (href === "/learn/path") return { to: "/learn/path" };
  const foundationTopic = href.match(/^\/learn\/foundation\/([^/#]+)$/);
  if (foundationTopic) return { to: "/learn/foundation/$topicId", params: { topicId: foundationTopic[1]! } };
  const lesson = href.match(/^\/learn\/lessons\/[^/]+$/);
  if (lesson && topicId) return { to: "/learn/topics/$topicId/lesson", params: { topicId } };
  const oneshot = href.match(/^\/learn\/topics\/([^/]+)\/oneshot$/);
  if (oneshot) return { to: "/learn/topics/$topicId/resources", params: { topicId: oneshot[1]! } };
  const notes = href.match(/^\/learn\/topics\/([^/]+)\/notes$/);
  if (notes) return { to: "/learn/topics/$topicId/notes", params: { topicId: notes[1]! } };
  const flashcards = href.match(/^\/learn\/topics\/([^/]+)\/flashcards$/);
  if (flashcards) return { to: "/learn/topics/$topicId/flashcards", params: { topicId: flashcards[1]! } };
  const mindMap = href.match(/^\/learn\/topics\/([^/]+)\/mind-map$/);
  if (mindMap) return { to: "/learn/topics/$topicId/mind-map", params: { topicId: mindMap[1]! } };
  const teachingKind = href.match(/^\/learn\/topics\/([^/]+)\/(quick|concepts|examples|trace|predict|syntax|practice)$/);
  if (teachingKind) return { to: "/learn/topics/$topicId/$kind", params: { topicId: teachingKind[1]!, kind: teachingKind[2]! } };
  const topic = href.match(/^\/learn\/topics\/([^/]+)$/);
  if (topic) return { to: "/learn/topics/$topicId", params: { topicId: topic[1]! } };
  const studio = href.match(/^\/studio\/([^/]+)$/);
  if (studio) return { to: "/studio/$exerciseId", params: { exerciseId: studio[1]! } };
  const topicAssess = href.match(/^\/learn\/assessments\/topic\/([^/]+)$/);
  if (topicAssess) return { to: "/learn/assessments/$assessmentId", params: { assessmentId: `topic:${topicAssess[1]}` } };
  const unitAssess = href.match(/^\/learn\/assessments\/unit\/([^/]+)$/);
  if (unitAssess) return { to: "/learn/assessments/$assessmentId", params: { assessmentId: `unit:${unitAssess[1]}` } };
  const assessmentId = href.match(/^\/learn\/assessments\/([^/]+)$/);
  if (assessmentId) {
    const resolved = resolveAssessmentId(decodeURIComponent(assessmentId[1]!));
    if (resolved.startsWith("topic:") || resolved.startsWith("unit:")) {
      return { to: "/learn/assessments/$assessmentId", params: { assessmentId: resolved } };
    }
  }
  const unit = href.match(/^\/learn\/units\/([^/]+)$/);
  if (unit) return { to: "/learn/units/$unitId", params: { unitId: unit[1]! } };
  return null;
}

export function nextActionLabel(kind: ResourceKind) {
  if (kind === "DIAGNOSTIC") return "Open diagnostic";
  if (kind === "FOUNDATION") return "Open foundation notes";
  if (kind === "DEEP_LESSON") return "Open the lesson";
  if (kind === "ONE_SHOT") return "Open one-shot";
  if (kind === "QUICK_REVISION") return "Revise this topic";
  if (kind === "INDEPENDENT_PRACTICE") return "Open the studio";
  if (kind === "GUIDED_PRACTICE") return "Open guided practice";
  if (kind === "TOPIC_ASSESSMENT") return "Open topic assessment";
  if (kind === "UNIT_ASSESSMENT") return "Open unit assessment";
  return "Continue";
}

export function masteryLabel(state: MasteryRecord) {
  if (state === "mastered") return "Mastered";
  if (state === "assessment_passed") return "Assessment passed";
  if (state === "practised") return "Practised";
  if (state === "started") return "Opened";
  return "No mastery events";
}

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

function hrefOf(row: Record<string, unknown>, fallback = "") {
  const value = field(row, "href");
  return typeof value === "string" ? value : fallback;
}

export function mapRecommendation(raw: Record<string, unknown>) {
  const topicId = text(raw, "topicId");
  const href = hrefOf(raw);
  const unmet = field(raw, "unmetPrerequisites");
  return {
    topicId,
    resourceType: (text(raw, "resourceType", "DEEP_LESSON") as ResourceKind),
    reason: text(raw, "reason"),
    href,
    dest: destFromAcademyHref(href, topicId),
    availability: (text(raw, "availability", "UNAVAILABLE") as ResourceAvailability),
    unmetPrerequisites: Array.isArray(unmet) ? unmet.map(String) : [],
    startIntent: (field(raw, "startIntent") as StartIntent | null) ?? null,
    placement: (field(raw, "placement") as PlacementState) ?? "NOT_ASSESSED",
    mastery: (field(raw, "mastery") as MasteryRecord) ?? null,
    readiness: null as null,
  };
}

export function mapLearningPath(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw.map((unit) => {
    const row = asRecord(unit);
    const topics = field(row, "topics");
    return {
      id: text(row, "id"),
      title: text(row, "title", text(row, "id")),
      topics: Array.isArray(topics) ? topics.map((topic) => {
        const item = asRecord(topic);
        const id = text(item, "id");
        const href = hrefOf(item, `/learn/topics/${id}`);
        const prerequisites = field(item, "prerequisites");
        return {
          id,
          sourceLabel: text(item, "sourceLabel"),
          title: text(item, "title", id),
          placement: (field(item, "placement") as PlacementState) ?? "NOT_ASSESSED",
          mastery: (field(item, "mastery") as MasteryRecord) ?? null,
          readiness: null as null,
          lesson: text(item, "lesson", "UNAVAILABLE") as ResourceAvailability,
          notes: text(item, "notes", "UNAVAILABLE") as ResourceAvailability,
          laboratory: text(item, "laboratory", "UNAVAILABLE") as ResourceAvailability,
          href,
          dest: destFromAcademyHref(href, id),
          accessible: field(item, "accessible") !== false,
          prerequisites: Array.isArray(prerequisites)
            ? prerequisites.map((p) => {
                const prereq = asRecord(p);
                return { id: text(prereq, "id"), kind: text(prereq, "kind") };
              })
            : [],
        };
      }) : [],
    };
  });
}

export function mapDashboard(raw: Record<string, unknown>, source: "demo" | "original") {
  const analytics = asRecord(field(raw, "analytics"));
  const nextRaw = field(raw, "recommendedNext");
  const next = nextRaw && typeof nextRaw === "object" ? mapRecommendation(asRecord(nextRaw)) : null;
  const continueRaw = field(raw, "continueLearning");
  const continueLearning = continueRaw && typeof continueRaw === "object"
    ? (() => {
        const row = asRecord(continueRaw);
        const topicId = text(row, "topicId");
        const href = hrefOf(row);
        return { topicId, title: text(row, "title", topicId), kind: text(row, "kind"), at: text(row, "at"), href, dest: destFromAcademyHref(href, topicId) };
      })()
    : null;
  const weak = field(raw, "weakConcepts");
  const pending = field(raw, "pendingAssessments");
  return {
    source,
    greeting: text(raw, "greeting", "Welcome"),
    rollIdentifier: text(raw, "rollIdentifier"),
    displayName: typeof field(raw, "displayName") === "string" ? String(field(raw, "displayName")) : null,
    startIntent: (field(raw, "startIntent") as StartIntent | null) ?? null,
    continueLearning,
    recommendedNext: next,
    path: mapLearningPath(field(raw, "path")),
    weakConcepts: Array.isArray(weak)
      ? weak.map((row) => {
          const item = asRecord(row);
          const topicId = text(item, "topicId");
          return { topicId, title: text(item, "title"), evidence: text(item, "evidence"), dest: destForTopic(topicId) };
        })
      : [],
    pendingAssessments: Array.isArray(pending)
      ? pending.map((row) => {
          const item = asRecord(row);
          const href = hrefOf(item);
          return {
            kind: text(item, "kind"),
            label: text(item, "label"),
            href,
            dest: destFromAcademyHref(href),
            availability: text(item, "availability", "UNAVAILABLE") as ResourceAvailability,
          };
        })
      : [],
    scoresAreSeparate: field(raw, "scoresAreSeparate") === true,
    note: text(raw, "note"),
    analytics: {
      empty: field(analytics, "empty") === true,
      unitProgress: Array.isArray(field(analytics, "unitProgress")) ? (field(analytics, "unitProgress") as unknown[]).map((row) => {
        const item = asRecord(row);
        return {
          id: text(item, "id"),
          title: text(item, "title"),
          teachingTopics: Number(field(item, "teachingTopics") ?? 0),
          opened: Number(field(item, "opened") ?? 0),
          practised: Number(field(item, "practised") ?? 0),
          demonstrated: Number(field(item, "demonstrated") ?? 0),
          mastered: Number(field(item, "mastered") ?? 0),
          note: text(item, "note"),
        };
      }) : [],
      recentlyOpened: Array.isArray(field(analytics, "recentlyOpened")) ? (field(analytics, "recentlyOpened") as unknown[]).map(mapActivity) : [],
      recentlyPractised: Array.isArray(field(analytics, "recentlyPractised")) ? (field(analytics, "recentlyPractised") as unknown[]).map(mapActivity) : [],
      assessmentHistory: Array.isArray(field(analytics, "assessmentHistory")) ? (field(analytics, "assessmentHistory") as unknown[]).map((row) => {
        const item = asRecord(row);
        const href = hrefOf(item);
        return {
          assessmentId: text(item, "assessmentId"),
          label: text(item, "label"),
          attempt: Number(field(item, "attempt") ?? 0),
          earned: Number(field(item, "earned") ?? 0),
          total: Number(field(item, "total") ?? 0),
          completedAt: text(item, "completedAt"),
          href,
          dest: destFromAcademyHref(href),
        };
      }) : [],
      needPractice: Array.isArray(field(analytics, "needPractice")) ? (field(analytics, "needPractice") as unknown[]).map(mapFlag) : [],
      mastered: Array.isArray(field(analytics, "mastered")) ? (field(analytics, "mastered") as unknown[]).map(mapFlag) : [],
      demonstrated: Array.isArray(field(analytics, "demonstrated")) ? (field(analytics, "demonstrated") as unknown[]).map(mapFlag) : [],
      unsupported: Array.isArray(field(analytics, "unsupported")) ? (field(analytics, "unsupported") as unknown[]).map(String) : [],
    },
  };
}

function destForTopic(topicId: string): EmergentDest {
  return { to: "/learn/topics/$topicId", params: { topicId } };
}

function mapActivity(row: unknown) {
  const item = asRecord(row);
  const topicId = text(item, "topicId");
  const href = hrefOf(item);
  return { topicId, title: text(item, "title", topicId), kind: text(item, "kind"), at: text(item, "at"), href, dest: destFromAcademyHref(href, topicId) };
}

function mapFlag(row: unknown) {
  const item = asRecord(row);
  const topicId = text(item, "topicId");
  const href = hrefOf(item);
  return { topicId, title: text(item, "title", topicId), evidence: text(item, "evidence"), href, dest: destFromAcademyHref(href, topicId) };
}

export type AdaptiveDashboard = ReturnType<typeof mapDashboard>;
export type AdaptiveRecommendation = ReturnType<typeof mapRecommendation>;
export type AdaptivePath = ReturnType<typeof mapLearningPath>;

export function dashboardIntro(input: {
  startIntent: StartIntent | null;
  openDiagnostic: boolean;
  submittedDiagnostic: boolean;
  empty: boolean;
}): "onboarding" | "resume-diagnostic" | "optional-diagnostic" | null {
  if (!input.startIntent) return "onboarding";
  if (input.openDiagnostic) return "resume-diagnostic";
  if (input.empty && !input.submittedDiagnostic) return "optional-diagnostic";
  return null;
}
