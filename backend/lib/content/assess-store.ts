import { randomUUID } from "node:crypto";

export type AttemptItemResult = {
  id: string;
  topicId: string;
  family: string;
  correct: boolean;
  marks: number;
  max: number;
};

export type AssessmentAttempt = {
  id: string;
  studentId: string;
  assessmentId: string;
  attempt: number;
  earned: number;
  total: number;
  byTopic: Record<string, { earned: number; max: number }>;
  startedAt: string;
  completedAt: string;
  idempotencyKey?: string;
  responses?: Record<string, string>;
  itemResults?: AttemptItemResult[];
};

const g = globalThis as typeof globalThis & { __cforgeAssess?: AssessmentAttempt[] };

function rows() {
  if (!g.__cforgeAssess) g.__cforgeAssess = [];
  return g.__cforgeAssess;
}

export function resetAssessments() {
  g.__cforgeAssess = [];
}

export function nextAttemptNumber(studentId: string, assessmentId: string) {
  return rows().filter((r) => r.studentId === studentId && r.assessmentId === assessmentId).length + 1;
}

export function rememberAttempt(row: AssessmentAttempt) {
  const list = rows();
  const byId = list.find((existing) => existing.id === row.id);
  if (byId) return byId;
  if (row.idempotencyKey) {
    const byKey = list.find(
      (existing) =>
        existing.studentId === row.studentId &&
        existing.assessmentId === row.assessmentId &&
        existing.idempotencyKey === row.idempotencyKey,
    );
    if (byKey) return byKey;
  }
  list.push(row);
  return row;
}

function jsonField<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

function iso(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  return new Date(String(value)).toISOString();
}

export function rememberAttemptFromRow(row: Record<string, unknown>) {
  return rememberAttempt({
    id: String(row.id),
    studentId: String(row.student_id),
    assessmentId: String(row.assessment_id),
    attempt: Number(row.attempt_no),
    earned: Number(row.earned),
    total: Number(row.total),
    byTopic: jsonField(row.by_topic, {}),
    startedAt: iso(row.started_at),
    completedAt: iso(row.completed_at),
    idempotencyKey: row.idempotency_key ? String(row.idempotency_key) : undefined,
    responses: jsonField(row.responses, {}),
    itemResults: jsonField(row.item_results, []),
  });
}

export function recordAttempt(row: Omit<AssessmentAttempt, "id" | "attempt"> & { attempt?: number }) {
  if (row.idempotencyKey) {
    const existing = rows().find(
      (r) =>
        r.studentId === row.studentId &&
        r.assessmentId === row.assessmentId &&
        r.idempotencyKey === row.idempotencyKey,
    );
    if (existing) return existing;
  }
  const attempt: AssessmentAttempt = {
    ...row,
    id: randomUUID(),
    attempt: row.attempt ?? nextAttemptNumber(row.studentId, row.assessmentId),
  };
  rows().push(attempt);
  return attempt;
}

export function attemptsFor(studentId: string) {
  return rows().filter((r) => r.studentId === studentId);
}

export function allAttempts() {
  return [...rows()];
}
