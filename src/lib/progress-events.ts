export const TEACHING_PROGRESS_KINDS = ["notes_viewed", "oneshot_completed", "flashcards_reviewed"] as const;
export type TeachingProgressKind = (typeof TEACHING_PROGRESS_KINDS)[number];

export function teachingProgressRequest(topicId: string, kind: TeachingProgressKind) {
  if (!topicId) return { ok: false as const, error: "invalid_body" as const };
  if (!(TEACHING_PROGRESS_KINDS as readonly string[]).includes(kind)) {
    return { ok: false as const, error: "invalid_kind" as const };
  }
  return {
    ok: true as const,
    path: "/api/v1/progress",
    payload: {
      topicId,
      kind,
      dimension: "concept",
      assisted: false,
    },
  };
}
