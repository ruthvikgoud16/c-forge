import { readSession } from "@/lib/academy/session";

/** Identity comes only from the signed session. Client studentId is ignored. */
export async function requireStudent() {
  const session = await readSession();
  if (!session) return null;
  return session;
}

const FORBIDDEN_CLIENT_CLAIMS = [
  "studentId",
  "student_id",
  "placement",
  "mastery",
  "readiness",
  "state",
  "topicState",
  "correct",
  "method",
  "topicId",
  "rubricVersion",
] as const;

export function stripClientStudentId<T extends Record<string, unknown>>(body: T) {
  const copy = { ...body };
  delete copy.studentId;
  delete copy.student_id;
  return copy;
}

/** Browser cannot declare identity or derived learning scores. */
export function rejectDerivedClaims(body: Record<string, unknown>) {
  const hit = FORBIDDEN_CLIENT_CLAIMS.filter((key) => key in body && key !== "topicId");
  const derived = hit.filter((key) =>
    ["placement", "mastery", "readiness", "state", "topicState"].includes(key),
  );
  return derived;
}

export function publicAnswerFieldsOnly(row: Record<string, unknown>) {
  return { itemId: row.itemId, value: row.value };
}
