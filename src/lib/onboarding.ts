export const START_INTENTS = [
  "from_scratch",
  "test_knowledge",
  "theory_weak_coding",
  "exam_revision",
  "problem_solving",
] as const;

export type StartIntent = (typeof START_INTENTS)[number];

export const INTENT_COPY: Record<StartIntent, { title: string; lede: string }> = {
  from_scratch: {
    title: "Start from the beginning",
    lede: "Build C from the first ideas, without assuming prior programming.",
  },
  test_knowledge: {
    title: "Check what I already know",
    lede: "Use the diagnostic to see which Unit 1 ideas you can already show.",
  },
  theory_weak_coding: {
    title: "I know the ideas, not the code",
    lede: "Prefer writing and tracing programs over more theory.",
  },
  exam_revision: {
    title: "Revise for examinations",
    lede: "Focus on the official topics you need to practise again.",
  },
  problem_solving: {
    title: "Get better at solving problems",
    lede: "Spend more time on exercises and worked examples.",
  },
};

export function isStartIntent(value: unknown): value is StartIntent {
  return typeof value === "string" && (START_INTENTS as readonly string[]).includes(value);
}
