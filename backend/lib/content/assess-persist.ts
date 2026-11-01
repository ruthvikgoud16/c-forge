import { getSql, withStudentTx } from "@/lib/academy/db";
import { assessmentEvidence } from "@/lib/content/assess-score";
import { hydrateStudent, insertLearningEvent } from "@/lib/learning/persist";
import { addEvent } from "@/lib/learning/store";
import { LearningPersistError, learningStorageMode } from "@/lib/learning/storage-mode";
import type { LearningEvent } from "@/lib/learning/types";
import {
  recordAttempt,
  attemptsFor,
  nextAttemptNumber,
  rememberAttempt,
  type AssessmentAttempt,
  type AttemptItemResult,
} from "./assess-store";

export type PersistedAttempt = AssessmentAttempt & {
  responses: Record<string, string>;
  itemResults: AttemptItemResult[];
  idempotencyKey?: string;
  replayed?: boolean;
};

function asPersisted(row: AssessmentAttempt, replayed: boolean): PersistedAttempt {
  return {
    ...row,
    responses: row.responses ?? {},
    itemResults: row.itemResults ?? [],
    replayed,
  };
}

function cachePersisted(row: PersistedAttempt) {
  rememberAttempt({
    id: row.id,
    studentId: row.studentId,
    assessmentId: row.assessmentId,
    attempt: row.attempt,
    earned: row.earned,
    total: row.total,
    byTopic: row.byTopic,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
    idempotencyKey: row.idempotencyKey,
    responses: row.responses,
    itemResults: row.itemResults,
  });
}

function mapRow(row: Record<string, unknown>): PersistedAttempt {
  return {
    id: String(row.id),
    studentId: String(row.student_id),
    assessmentId: String(row.assessment_id),
    attempt: Number(row.attempt_no),
    earned: Number(row.earned),
    total: Number(row.total),
    byTopic: (row.by_topic ?? {}) as AssessmentAttempt["byTopic"],
    startedAt: new Date(String(row.started_at)).toISOString(),
    completedAt: new Date(String(row.completed_at)).toISOString(),
    responses: (row.responses ?? {}) as Record<string, string>,
    itemResults: (row.item_results ?? []) as PersistedAttempt["itemResults"],
    idempotencyKey: row.idempotency_key ? String(row.idempotency_key) : undefined,
  };
}

export async function persistPracticeAttempt(input: {
  studentId: string;
  assessmentId: string;
  earned: number;
  total: number;
  byTopic: AssessmentAttempt["byTopic"];
  responses: Record<string, string>;
  itemResults: PersistedAttempt["itemResults"];
  startedAt: string;
  completedAt: string;
  idempotencyKey?: string;
  evidence?: LearningEvent[];
}): Promise<PersistedAttempt> {
  for (const event of input.evidence ?? []) {
    if (event.studentId !== input.studentId) {
      throw new LearningPersistError("missing_student_identity");
    }
  }
  if (learningStorageMode() === "memory") {
    const existing = input.idempotencyKey
      ? attemptsFor(input.studentId).find(
          (row) => row.assessmentId === input.assessmentId && row.idempotencyKey === input.idempotencyKey,
        )
      : undefined;
    if (existing) return asPersisted(existing, true);
    const row = recordAttempt({
      studentId: input.studentId,
      assessmentId: input.assessmentId,
      earned: input.earned,
      total: input.total,
      byTopic: input.byTopic,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
      idempotencyKey: input.idempotencyKey,
      responses: input.responses,
      itemResults: input.itemResults,
    });
    return asPersisted(row, false);
  }

  try {
    return await withStudentTx(input.studentId, async (tx) => {
      if (input.idempotencyKey) {
        const existing = await tx`
          SELECT * FROM practice_assessment_attempts
          WHERE student_id = ${input.studentId}
            AND assessment_id = ${input.assessmentId}
            AND idempotency_key = ${input.idempotencyKey}
        `;
        if (existing[0]) {
          const row = mapRow(existing[0] as Record<string, unknown>);
          cachePersisted(row);
          return { ...row, replayed: true };
        }
      }
      const max = await tx`
        SELECT coalesce(max(attempt_no), 0)::int AS n
        FROM practice_assessment_attempts
        WHERE student_id = ${input.studentId} AND assessment_id = ${input.assessmentId}
      `;
      const attemptNo = Number(max[0]?.n ?? 0) + 1;
      const inserted = await tx`
        INSERT INTO practice_assessment_attempts (
          student_id, assessment_id, attempt_no, earned, total, by_topic,
          responses, item_results, started_at, completed_at, idempotency_key
        ) VALUES (
          ${input.studentId}, ${input.assessmentId}, ${attemptNo},
          ${input.earned}, ${input.total}, ${tx.json(input.byTopic)},
          ${tx.json(input.responses)}, ${tx.json(input.itemResults)},
          ${input.startedAt}, ${input.completedAt}, ${input.idempotencyKey ?? null}
        )
        RETURNING *
      `;
      for (const event of input.evidence ?? []) {
        await insertLearningEvent(tx, event);
      }
      const row = mapRow(inserted[0] as Record<string, unknown>);
      cachePersisted(row);
      return { ...row, replayed: false };
    });
  } catch (error) {
    if (error instanceof LearningPersistError) throw error;
    const message = error instanceof Error ? error.message : "persist failed";
    throw new LearningPersistError(message);
  }
}

export async function listPracticeAttempts(studentId: string, assessmentId?: string) {
  if (learningStorageMode() === "memory") {
    return attemptsFor(studentId)
      .filter((r) => !assessmentId || r.assessmentId === assessmentId)
      .map((r) => asPersisted(r, false));
  }
  return withStudentTx(studentId, async (tx) => {
    const rows = assessmentId
      ? await tx`
          SELECT * FROM practice_assessment_attempts
          WHERE student_id = ${studentId} AND assessment_id = ${assessmentId}
          ORDER BY attempt_no
        `
      : await tx`
          SELECT * FROM practice_assessment_attempts
          WHERE student_id = ${studentId}
          ORDER BY completed_at
        `;
    return rows.map((row) => mapRow(row as Record<string, unknown>));
  });
}

export async function commitPracticeSubmission(input: {
  studentId: string;
  assessmentId: string;
  topicId: string;
  earned: number;
  total: number;
  byTopic: AssessmentAttempt["byTopic"];
  responses: Record<string, string>;
  itemResults: PersistedAttempt["itemResults"];
  startedAt: string;
  completedAt: string;
  idempotencyKey?: string;
}): Promise<PersistedAttempt> {
  const evidence = assessmentEvidence({
    studentId: input.studentId,
    topicId: input.topicId,
    earned: input.earned,
    total: input.total,
    byTopic: input.byTopic,
    completedAt: input.completedAt,
  });
  await hydrateStudent(input.studentId);
  const attempt = await persistPracticeAttempt({ ...input, evidence });
  if (!attempt.replayed) {
    for (const event of evidence) addEvent(event);
  }
  return attempt;
}

export function publicAttempt(row: PersistedAttempt) {
  return {
    id: row.id,
    assessmentId: row.assessmentId,
    attempt: row.attempt,
    earned: row.earned,
    total: row.total,
    byTopic: row.byTopic,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
    responses: row.responses,
    itemResults: row.itemResults,
  };
}

export async function assertAssessmentSchema() {
  const client = getSql();
  if (!client) throw new LearningPersistError("DATABASE_URL is not configured");
  const rows = await client`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'practice_assessment_attempts'
  `;
  if (!rows.length) throw new LearningPersistError("assessment migrations are missing");
}

export { nextAttemptNumber };
