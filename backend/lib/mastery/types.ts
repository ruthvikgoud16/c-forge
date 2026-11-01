export const MASTERY_DIMENSIONS = [
  "concept",
  "trace",
  "predict",
  "syntax",
  "independent_write",
  "debug",
  "exam",
] as const;

export type MasteryDimension = (typeof MASTERY_DIMENSIONS)[number];

export type TopicMasteryState = "started" | "practised" | "assessment_passed" | "mastered";

export function deriveState(input: {
  opened: boolean;
  practised: boolean;
  assessmentPassed: boolean;
  independentOk: boolean;
  retentionOk: boolean;
}): TopicMasteryState | null {
  if (input.assessmentPassed && input.independentOk && input.retentionOk) return "mastered";
  if (input.assessmentPassed) return "assessment_passed";
  if (input.practised) return "practised";
  if (input.opened) return "started";
  return null;
}
