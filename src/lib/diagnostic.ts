import type { DiagnosticItem, DiagnosticSessionSummary, PlacementState, StartIntent } from "@/domain/types";

const KEY_FIELDS = ["answer", "expectedStdout", "expected", "key", "answerKey"] as const;

export function assertNoAnswerKey(item: DiagnosticItem) {
  const record = item as unknown as Record<string, unknown>;
  for (const field of KEY_FIELDS) {
    if (field in record && record[field] != null) {
      throw new Error(`Diagnostic item leaked ${field}.`);
    }
  }
  return item;
}

export function buildDiagnosticAnswers(items: DiagnosticItem[], values: Record<string, string>) {
  return items.map((item) => ({
    itemId: item.id,
    value: item.kind === "mcq" ? Number(values[item.id]) : String(values[item.id] ?? ""),
  }));
}

export function firstRunPath(input: {
  startIntent: StartIntent | null;
  sessions: DiagnosticSessionSummary[];
}): "/learn/onboarding" | "/learn/diagnostic" | "/learn" {
  if (!input.startIntent) return "/learn/onboarding";
  const open = input.sessions.some((session) => session.status === "open");
  if (open) return "/learn/diagnostic";
  return "/learn";
}

export function placementText(state: PlacementState) {
  return PLACEMENT_COPY[state] ?? PLACEMENT_COPY.NOT_ASSESSED;
}

export const PLACEMENT_COPY: Record<PlacementState, { title: string; lede: string }> = {
  NOT_ASSESSED: { title: "Not yet assessed", lede: "This topic has no diagnostic evidence yet." },
  NEEDS_FOUNDATION: { title: "Start with the foundations", lede: "The server placed this topic at the foundation step. That is not a grade." },
  NEEDS_LEARNING: { title: "Ready to learn", lede: "The server has not seen enough evidence on this topic yet." },
  PARTIALLY_DEMONSTRATED: { title: "Shown in one way", lede: "One method family was shown. Placement still needs a second method." },
  DEMONSTRATED: { title: "Shown in more than one way", lede: "Placement only. This is not mastery and not a completed unit." },
  NEEDS_REVISION: { title: "Time to revisit", lede: "Earlier demonstration is no longer supported by the latest answers." },
};
