import { officialTopics, officialUnits } from "@/lib/curriculum/catalog";
import { unmetPrerequisites } from "@/lib/curriculum/prerequisites";
import { eventsForStudent, getPlacement, getPreference } from "./store";
import { topicState } from "@/lib/curriculum/progress";
import type { PlacementState, StartIntent } from "./types";
import { hrefFor, topicAvailability, type ResourceKind } from "./resources";
import { displayLabel } from "@/lib/roster/rolls";
import { getRosterRow } from "@/lib/roster/store";
import { studentLearningAnalytics } from "./analytics";

export type Recommendation = {
  topicId: string;
  resourceType: ResourceKind;
  reason: string;
  href: string;
  availability: "AVAILABLE" | "PLANNED" | "UNVERIFIED" | "UNAVAILABLE";
  unmetPrerequisites: string[];
  startIntent: StartIntent | null;
  placement: PlacementState;
  mastery: ReturnType<typeof topicState>;
  readiness: null;
};

function demonstratedSet(studentId: string) {
  const set = new Set<string>();
  for (const topic of officialTopics()) {
    if (getPlacement(studentId, topic.id) === "DEMONSTRATED") set.add(topic.id);
  }
  return set;
}

function pickAvailable(kind: ResourceKind, topicId: string): { kind: ResourceKind; availability: Recommendation["availability"] } {
  const avail = topicAvailability(topicId);
  if (kind === "ONE_SHOT") return { kind: avail.lesson === "AVAILABLE" ? "DEEP_LESSON" : "DEEP_LESSON", availability: avail.oneShot === "AVAILABLE" ? "AVAILABLE" : avail.lesson };
  if (kind === "QUICK_REVISION") {
    if (avail.oneShot === "AVAILABLE") return { kind: "ONE_SHOT", availability: "AVAILABLE" };
    if (avail.notes === "AVAILABLE") return { kind, availability: "AVAILABLE" };
    return { kind: avail.lesson === "AVAILABLE" ? "DEEP_LESSON" : kind, availability: avail.lesson === "AVAILABLE" ? "AVAILABLE" : "PLANNED" };
  }
  if (kind === "INDEPENDENT_PRACTICE" || kind === "GUIDED_PRACTICE") {
    if (avail.practice.status === "AVAILABLE") return { kind: "INDEPENDENT_PRACTICE", availability: "AVAILABLE" };
    if (avail.lesson === "AVAILABLE") return { kind: "GUIDED_PRACTICE", availability: "AVAILABLE" };
    return { kind, availability: "PLANNED" };
  }
  if (kind === "DEEP_LESSON") return { kind, availability: avail.lesson };
  if (kind === "FOUNDATION") return { kind, availability: "AVAILABLE" };
  if (kind === "DIAGNOSTIC") return { kind, availability: avail.diagnostic };
  if (kind === "TOPIC_ASSESSMENT") return { kind, availability: avail.topicAssessment };
  if (kind === "UNIT_ASSESSMENT") return { kind, availability: avail.unitAssessment };
  return { kind, availability: avail.lesson };
}

function pack(
  studentId: string,
  topicId: string,
  kind: ResourceKind,
  reason: string,
): Recommendation {
  const chosen = pickAvailable(kind, topicId);
  const placement = getPlacement(studentId, topicId);
  return {
    topicId,
    resourceType: chosen.kind,
    reason,
    href: hrefFor(chosen.kind, topicId),
    availability: chosen.availability,
    unmetPrerequisites: unmetPrerequisites(topicId, demonstratedSet(studentId)).map((e) => e.prerequisiteId),
    startIntent: getPreference(studentId) ?? null,
    placement,
    mastery: topicState(studentId, topicId),
    readiness: null,
  };
}

export function recommendNext(studentId: string): Recommendation {
  const intent = getPreference(studentId);
  const topics = officialTopics();

  const foundation = topics.find((t) => getPlacement(studentId, t.id) === "NEEDS_FOUNDATION");
  if (foundation) {
    return pack(
      studentId,
      foundation.id,
      "FOUNDATION",
      "You have not yet learned the prerequisite idea for this topic. Open the foundation notes, then the deep lesson. The lesson stays available either way.",
    );
  }

  const revise = topics.find((t) => getPlacement(studentId, t.id) === "NEEDS_REVISION");
  if (revise) {
    return pack(
      studentId,
      revise.id,
      "QUICK_REVISION",
      `Your later answers show ${revise.title} needs revision. Placement is not mastery — open the lesson again.`,
    );
  }

  if (intent === "theory_weak_coding") {
    const coding = topics.find((t) => ["u1-t4", "u1-t5", "u1-t6"].includes(t.id) && getPlacement(studentId, t.id) !== "NEEDS_LEARNING");
    if (coding) {
      const place = getPlacement(studentId, coding.id);
      if (place === "DEMONSTRATED" || place === "PARTIALLY_DEMONSTRATED") {
        return pack(
          studentId,
          coding.id,
          "INDEPENDENT_PRACTICE",
          "You understand the idea but need practice writing the program. Run and Submit stay on the judge — hidden tests stay hidden.",
        );
      }
    }
  }

  const partial = topics.find((t) => getPlacement(studentId, t.id) === "PARTIALLY_DEMONSTRATED");
  if (partial) {
    return pack(
      studentId,
      partial.id,
      "GUIDED_PRACTICE",
      `You showed part of ${partial.title}. One method is not enough for DEMONSTRATED. Finish a second kind of question, or open the deep lesson.`,
    );
  }

  if (intent === "test_knowledge") {
    const unassessed = topics.find((t) => getPlacement(studentId, t.id) === "NOT_ASSESSED" && topicAvailability(t.id).diagnostic === "AVAILABLE");
    if (unassessed) {
      return pack(
        studentId,
        unassessed.id,
        "DIAGNOSTIC",
        "You haven't assessed your understanding of this topic yet. Take the diagnostic, or open the full lesson if you prefer to learn first.",
      );
    }
  }

  if (intent === "exam_revision") {
    const target = topics.find((t) => getPlacement(studentId, t.id) !== "DEMONSTRATED" && topicAvailability(t.id).lesson === "AVAILABLE") ?? topics[0];
    return pack(
      studentId,
      target.id,
      "QUICK_REVISION",
      "Revise this topic in one sitting. One-shots are teaching sessions, not university papers. No previous-year bank exists until faculty uploads papers.",
    );
  }

  const demonstratedSkip = topics.find((t) => getPlacement(studentId, t.id) === "DEMONSTRATED");
  if (demonstratedSkip) {
    const next = topics.find((t) => {
      const p = getPlacement(studentId, t.id);
      return p === "NOT_ASSESSED" || p === "NEEDS_LEARNING";
    });
    if (next && topicAvailability(next.id).lesson === "AVAILABLE") {
      return pack(
        studentId,
        next.id,
        "DEEP_LESSON",
        "You demonstrated the earlier topic. Try this one next. You can still open any skipped lesson later.",
      );
    }
    if (next) {
      return pack(
        studentId,
        next.id,
        "DEEP_LESSON",
        "You demonstrated earlier work. The next official topic is listed, but a complete lesson is not written yet.",
      );
    }
  }

  const learn = topics.find((t) => {
    const p = getPlacement(studentId, t.id);
    return p === "NEEDS_LEARNING" || p === "NOT_ASSESSED";
  });
  const topic = learn ?? topics[0];
  const place = getPlacement(studentId, topic.id);
  if (place === "NOT_ASSESSED" && (intent === "from_scratch" || !intent)) {
    return pack(
      studentId,
      topic.id,
      "DEEP_LESSON",
      topicAvailability(topic.id).lesson === "AVAILABLE"
        ? "Start from the first available deep lesson. You can take a diagnostic later if you already know this."
        : "This official topic is on the syllabus, but the deep lesson is not written yet.",
    );
  }
  return pack(
    studentId,
    topic.id,
    "DEEP_LESSON",
    place === "NOT_ASSESSED"
      ? "You haven't assessed this topic yet. Open the lesson, or start a diagnostic."
      : "Open the deep lesson for this topic. Opening it is not mastery.",
  );
}

export function lastActivity(studentId: string) {
  const events = eventsForStudent(studentId);
  const last = events.at(-1);
  if (!last) return null;
  return {
    topicId: last.topicId,
    kind: last.kind,
    at: last.createdAt,
    href: hrefFor("DEEP_LESSON", last.topicId),
  };
}

export function weakConcepts(studentId: string) {
  const failed = eventsForStudent(studentId).filter((e) => e.kind === "diagnostic" && e.correct === false);
  const topics = [...new Set(failed.map((e) => e.topicId))];
  return topics.map((topicId) => {
    const topic = officialTopics().find((t) => t.id === topicId);
    return { topicId, title: topic?.title ?? topicId, evidence: "incorrect diagnostic answers" };
  });
}

export function learningPath(studentId: string) {
  return officialUnits().map((unit) => ({
    id: unit.id,
    title: unit.title,
    topics: unit.topics.map((t) => {
      const avail = topicAvailability(t.id);
      return {
        id: t.id,
        sourceLabel: t.sourceLabel,
        title: t.title,
        placement: getPlacement(studentId, t.id),
        mastery: topicState(studentId, t.id),
        readiness: null,
        lesson: avail.lesson,
        notes: avail.notes,
        laboratory: avail.laboratory,
        href: `/learn/topics/${t.id}`,
        accessible: true,
        prerequisites: unmetPrerequisites(t.id, demonstratedSet(studentId)).map((e) => ({
          id: e.prerequisiteId,
          kind: e.kind,
        })),
      };
    }),
  }));
}

export function dashboardPayload(studentId: string, rollIdentifier: string) {
  const row = getRosterRow(rollIdentifier);
  const next = recommendNext(studentId);
  const diagnosticAvailable = officialTopics().some((t) => topicAvailability(t.id).diagnostic === "AVAILABLE");
  const pendingAssessments = [
    ...(diagnosticAvailable
      ? [{ kind: "diagnostic", label: "Unit 1 diagnostic", href: "/learn/diagnostic", availability: "AVAILABLE" as const }]
      : []),
    {
      kind: "unit",
      label: "Unit 1 practice assessment",
      href: "/learn/assessments/unit/unit-1",
      availability: "AVAILABLE" as const,
    },
  ];
  const analytics = studentLearningAnalytics(studentId);
  return {
    greeting: `Welcome, ${displayLabel(rollIdentifier, row?.displayName)}`,
    rollIdentifier,
    displayName: row?.displayName ?? null,
    startIntent: getPreference(studentId) ?? null,
    continueLearning: lastActivity(studentId),
    recommendedNext: next,
    path: learningPath(studentId),
    weakConcepts: weakConcepts(studentId),
    pendingAssessments,
    scoresAreSeparate: true,
    note: "Placement, mastery, and readiness are not one percentage. Planned resources are labelled planned. Opening a lesson is not mastery.",
    analytics,
  };
}
