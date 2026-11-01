import {
  type PlacementMethod,
  type PlacementState,
  type TopicEvidence,
  PLACEMENT_RULES_VERSION,
} from "./types";

export { PLACEMENT_RULES_VERSION };

const FOUNDATION_TOPICS = new Set(["u1-t1"]);

export function evaluatePlacement(evidence: TopicEvidence): PlacementState {
  const passed = unique(evidence.methodsPassed);
  const attempted = unique(evidence.methodsAttempted);
  if (attempted.length === 0) return evidence.previousState ?? "NOT_ASSESSED";

  if (passed.length >= 2) {
    return "DEMONSTRATED";
  }

  if (evidence.previousState === "DEMONSTRATED" && passed.length < 2) {
    return "NEEDS_REVISION";
  }

  if (passed.length === 1) return "PARTIALLY_DEMONSTRATED";

  if (FOUNDATION_TOPICS.has(evidence.topicId)) return "NEEDS_FOUNDATION";
  return "NEEDS_LEARNING";
}

export function demonstratedRequiresTwoMethods(evidence: TopicEvidence) {
  return unique(evidence.methodsPassed).length >= 2;
}

function unique(methods: PlacementMethod[]) {
  return [...new Set(methods)];
}
