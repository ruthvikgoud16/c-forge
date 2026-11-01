export const TRACK_KINDS = [
  "notes_viewed",
  "oneshot_completed",
  "flashcards_reviewed",
  "simulator_used",
  "assessment_completed",
  "revision_completed",
  "lesson_opened",
] as const;

export async function trackClient(topicId: string, kind: string, extra?: { correct?: boolean }) {
  await fetch("/api/v1/progress", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ topicId, kind, dimension: "concept", assisted: false, ...extra }),
  });
}
