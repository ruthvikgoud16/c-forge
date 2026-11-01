export const START_INTENTS = [
  "from_scratch",
  "test_knowledge",
  "theory_weak_coding",
  "exam_revision",
  "problem_solving",
] as const;

export type StartIntent = (typeof START_INTENTS)[number];

export const PLACEMENT_STATES = [
  "NOT_ASSESSED",
  "NEEDS_FOUNDATION",
  "NEEDS_LEARNING",
  "PARTIALLY_DEMONSTRATED",
  "DEMONSTRATED",
  "NEEDS_REVISION",
] as const;

export type PlacementState = (typeof PLACEMENT_STATES)[number];

export const PLACEMENT_METHODS = [
  "concept",
  "definition",
  "mcq",
  "trace",
  "predict",
  "identify_error",
  "algorithm",
  "independent_write",
] as const;

export type PlacementMethod = (typeof PLACEMENT_METHODS)[number];

export const PLACEMENT_RULES_VERSION = "2d1-placement-v1";
export const CURRICULUM_VERSION = "lesson-plan-screenshots-2a";

export type LearningEvent = {
  id: string;
  studentId: string;
  topicId: string;
  lessonId?: string;
  kind: string;
  dimension: string;
  method?: PlacementMethod;
  assisted: boolean;
  correct?: boolean;
  curriculumVersion: string;
  rubricVersion: string;
  createdAt: string;
};

export type TopicEvidence = {
  topicId: string;
  methodsPassed: PlacementMethod[];
  methodsAttempted: PlacementMethod[];
  previousState?: PlacementState;
};
