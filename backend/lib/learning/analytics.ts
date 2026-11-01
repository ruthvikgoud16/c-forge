import { officialUnits, officialTopics } from "@/lib/curriculum/catalog";
import { topicState, unitProgress } from "@/lib/curriculum/progress";
import { attemptsFor } from "@/lib/content/assess-store";
import { eventsForStudent, getPlacement } from "./store";
import { hrefFor } from "./resources";

function isTeachingTopic(title: string, id: string) {
  if (/laboratory|experiments/i.test(title)) return false;
  if (id === "u5-t8") return false;
  return true;
}

export function teachingTopicsForUnit(unitId: string) {
  const unit = officialUnits().find((row) => row.id === unitId);
  return (unit?.topics ?? []).filter((topic) => isTeachingTopic(topic.title, topic.id));
}

function topicTitle(topicId: string) {
  return officialTopics().find((topic) => topic.id === topicId)?.title ?? topicId;
}

function uniqueRecent(studentId: string, kinds: string[], limit = 5) {
  const seen = new Set<string>();
  const out: Array<{ topicId: string; title: string; kind: string; at: string; href: string }> = [];
  const events = [...eventsForStudent(studentId)].reverse();
  for (const event of events) {
    if (!kinds.includes(event.kind) || seen.has(event.topicId)) continue;
    if (!isTeachingTopic(topicTitle(event.topicId), event.topicId)) continue;
    seen.add(event.topicId);
    out.push({
      topicId: event.topicId,
      title: topicTitle(event.topicId),
      kind: event.kind,
      at: event.createdAt,
      href: hrefFor("DEEP_LESSON", event.topicId),
    });
    if (out.length >= limit) break;
  }
  return out;
}

function assessmentHref(assessmentId: string) {
  if (assessmentId.startsWith("unit:")) return `/learn/assessments/unit/${assessmentId.slice(5)}`;
  if (assessmentId.startsWith("topic:")) return `/learn/assessments/topic/${assessmentId.slice(6)}`;
  return "/learn";
}

function assessmentLabel(assessmentId: string) {
  if (assessmentId.startsWith("unit:")) {
    const unit = officialUnits().find((row) => row.id === assessmentId.slice(5) || row.slug === assessmentId.slice(5));
    return unit ? `${unit.title} practice assessment` : assessmentId;
  }
  if (assessmentId.startsWith("topic:")) {
    return `${topicTitle(assessmentId.slice(6))} topic assessment`;
  }
  return assessmentId;
}

export function studentLearningAnalytics(studentId: string) {
  const events = eventsForStudent(studentId);
  const attempts = attemptsFor(studentId)
    .slice()
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
    .map((row) => ({
      assessmentId: row.assessmentId,
      label: assessmentLabel(row.assessmentId),
      attempt: row.attempt,
      earned: row.earned,
      total: row.total,
      completedAt: row.completedAt,
      href: assessmentHref(row.assessmentId),
    }));

  const unitProgressRows = officialUnits().map((unit) => {
    const topics = teachingTopicsForUnit(unit.id);
    const ids = topics.map((topic) => topic.id);
    const counts = unitProgress(studentId, ids);
    const opened = ids.filter((id) => {
      const state = topicState(studentId, id);
      return state === "started" || state === "practised" || state === "assessment_passed" || state === "mastered";
    }).length;
    const practised = ids.filter((id) => {
      const state = topicState(studentId, id);
      return state === "practised" || state === "assessment_passed" || state === "mastered";
    }).length;
    const demonstrated = ids.filter((id) => getPlacement(studentId, id) === "DEMONSTRATED").length;
    return {
      id: unit.id,
      title: unit.title,
      href: `/learn/units/${unit.slug}`,
      teachingTopics: ids.length,
      opened,
      practised,
      demonstrated,
      mastered: counts.mastered,
      note: "Opened is not mastered. Demonstrated comes from diagnostic placement, not from opening a lesson.",
    };
  });

  const needPractice = new Map<string, { topicId: string; title: string; evidence: string; href: string }>();
  const missed = eventsForStudent(studentId).filter((event) => event.kind === "diagnostic" && event.correct === false);
  for (const topicId of [...new Set(missed.map((event) => event.topicId))]) {
    needPractice.set(topicId, {
      topicId,
      title: topicTitle(topicId),
      evidence: "incorrect diagnostic answers",
      href: hrefFor("DEEP_LESSON", topicId),
    });
  }
  for (const topic of officialTopics().filter((row) => isTeachingTopic(row.title, row.id))) {
    const placement = getPlacement(studentId, topic.id);
    const mastery = topicState(studentId, topic.id);
    if (placement === "NEEDS_REVISION") {
      needPractice.set(topic.id, {
        topicId: topic.id,
        title: topic.title,
        evidence: "placement: needs revision (not mastery)",
        href: hrefFor("QUICK_REVISION", topic.id),
      });
    } else if (placement === "PARTIALLY_DEMONSTRATED") {
      needPractice.set(topic.id, {
        topicId: topic.id,
        title: topic.title,
        evidence: "placement: one method only — not demonstrated",
        href: hrefFor("GUIDED_PRACTICE", topic.id),
      });
    } else if (mastery === "practised") {
      needPractice.set(topic.id, {
        topicId: topic.id,
        title: topic.title,
        evidence: "practised, but no passed topic assessment or retained checks yet",
        href: `/learn/assessments/topic/${topic.id}`,
      });
    }
  }

  const mastered = officialTopics()
    .filter((topic) => isTeachingTopic(topic.title, topic.id) && topicState(studentId, topic.id) === "mastered")
    .map((topic) => ({
      topicId: topic.id,
      title: topic.title,
      evidence: "mastered: practised, assessment passed, independent write, and retained checks",
      href: `/learn/topics/${topic.id}`,
    }));

  const demonstrated = officialTopics()
    .filter((topic) => isTeachingTopic(topic.title, topic.id) && getPlacement(studentId, topic.id) === "DEMONSTRATED")
    .map((topic) => ({
      topicId: topic.id,
      title: topic.title,
      evidence: "diagnostic placement DEMONSTRATED — not the same as mastery",
      href: `/learn/topics/${topic.id}`,
    }));

  return {
    empty: events.length === 0 && attempts.length === 0,
    unitProgress: unitProgressRows,
    recentlyOpened: uniqueRecent(studentId, ["lesson_opened", "notes_viewed"]),
    recentlyPractised: uniqueRecent(studentId, ["guided", "independent", "knowledge_check", "assessment_completed"]),
    assessmentHistory: attempts,
    needPractice: [...needPractice.values()],
    mastered,
    demonstrated,
    unsupported: [
      "examination readiness",
      "class rank",
      "predicted marks",
      "time-on-task",
    ],
  };
}
