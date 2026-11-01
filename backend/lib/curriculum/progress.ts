import { deriveState, type TopicMasteryState } from "@/lib/mastery/types";
import { addEvent, eventsForStudent, eventsForTopic, resetLearningStore } from "@/lib/learning/store";

export type ProgressEvent = {
  studentId: string;
  topicId: string;
  lessonId?: string;
  kind: string;
  dimension: string;
  assisted: boolean;
  correct?: boolean;
};

type TopicAgg = {
  opened: boolean;
  practised: boolean;
  assessmentPassed: boolean;
  independentOk: boolean;
  retentionOk: boolean;
};

export function recordProgress(event: ProgressEvent) {
  addEvent({
    studentId: event.studentId,
    topicId: event.topicId,
    lessonId: event.lessonId,
    kind: event.kind,
    dimension: event.dimension,
    assisted: event.assisted,
    correct: event.correct,
  });
}

export function eventsFor(studentId: string) {
  return eventsForStudent(studentId).map((e) => ({
    studentId: e.studentId,
    topicId: e.topicId,
    lessonId: e.lessonId,
    kind: e.kind,
    dimension: e.dimension,
    assisted: e.assisted,
    correct: e.correct,
  }));
}

function aggregate(studentId: string, topicId: string): TopicAgg {
  const mine = eventsForTopic(studentId, topicId);
  const independent = mine.filter((e) => e.kind === "independent" || e.dimension === "independent_write");
  const checks = mine.filter((e) => e.kind === "knowledge_check");
  const checkOk = checks.length > 0 && checks.every((e) => e.correct);
  return {
    opened: mine.some((e) => e.kind === "lesson_opened"),
    practised: mine.some((e) => e.kind === "guided" || e.kind === "independent" || e.kind === "knowledge_check"),
    assessmentPassed:
      checkOk || mine.some((e) => e.kind === "assessment_completed" && e.correct === true),
    independentOk: independent.some((e) => e.correct === true),
    retentionOk: checkOk,
  };
}

export function topicState(studentId: string, topicId: string): TopicMasteryState | null {
  return deriveState(aggregate(studentId, topicId));
}

export function unitProgress(studentId: string, topicIds: string[]) {
  const states = topicIds.map((id) => topicState(studentId, id));
  const mastered = states.filter((s) => s === "mastered").length;
  return { total: topicIds.length, mastered, started: states.filter(Boolean).length };
}

export function resetProgress() {
  resetLearningStore();
}
