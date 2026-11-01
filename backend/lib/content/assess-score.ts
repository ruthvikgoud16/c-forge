import { randomUUID } from "node:crypto";
import type { LearningEvent } from "@/lib/learning/types";
import { CURRICULUM_VERSION, PLACEMENT_RULES_VERSION } from "@/lib/learning/types";

export const CLIENT_SCORE_FIELDS = [
  "earned",
  "total",
  "score",
  "attempt",
  "attempt_no",
  "itemResults",
  "correct",
  "byTopic",
] as const;

export function rejectedClientScoreFields(body: Record<string, unknown>) {
  return CLIENT_SCORE_FIELDS.filter((key) => Object.prototype.hasOwnProperty.call(body, key));
}

/** Server pass line: at least half the marks on that topic. No client correct flag. */
export function assessmentEvidence(input: {
  studentId: string;
  topicId: string;
  earned: number;
  total: number;
  byTopic: Record<string, { earned: number; max: number }>;
  completedAt: string;
}): LearningEvent[] {
  const topics = Object.entries(input.byTopic);
  const rows = topics.length > 0 ? topics : [[input.topicId, { earned: input.earned, max: input.total }] as const];
  return rows.map(([topicId, slot]) => ({
    id: randomUUID(),
    studentId: input.studentId,
    topicId,
    kind: "assessment_completed",
    dimension: "assessment",
    assisted: false,
    correct: slot.max > 0 && slot.earned * 2 >= slot.max,
    curriculumVersion: CURRICULUM_VERSION,
    rubricVersion: PLACEMENT_RULES_VERSION,
    createdAt: input.completedAt,
  }));
}
