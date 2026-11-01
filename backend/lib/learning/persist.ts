import { getSql, withStudentTx, type Sql } from "@/lib/academy/db";
import { rememberAttemptFromRow } from "@/lib/content/assess-store";
import {
  addEvent,
  eventsForStudent,
  rememberAnswer,
  rememberAssessmentAttempt,
  rememberSession,
  removeEvent,
  setPlacement,
  type DiagnosticAnswer,
  type DiagnosticAssessmentAttempt,
  type DiagnosticSession,
} from "./store";
import type { LearningEvent, PlacementState } from "./types";
import { CURRICULUM_VERSION, PLACEMENT_RULES_VERSION } from "./types";
import { LearningPersistError, learningStorageMode } from "./storage-mode";

const hydrated = new Set<string>();

async function writeOrThrow(studentId: string, work: (tx: NonNullable<ReturnType<typeof getSql>>) => Promise<void>) {
  if (learningStorageMode() === "memory") return;
  try {
    await withStudentTx(studentId, work);
  } catch (error) {
    if (error instanceof LearningPersistError) throw error;
    const message = error instanceof Error ? error.message : "persist failed";
    throw new LearningPersistError(message);
  }
}

export async function insertLearningEvent(tx: Sql, event: LearningEvent) {
  await tx`
    INSERT INTO learning_events (
      id, student_id, topic_id, lesson_id, kind, dimension, method,
      assisted, correct, curriculum_version, rubric_version, created_at
    ) VALUES (
      ${event.id}, ${event.studentId}, ${event.topicId}, ${event.lessonId ?? null},
      ${event.kind}, ${event.dimension}, ${event.method ?? null},
      ${event.assisted}, ${event.correct ?? null},
      ${event.curriculumVersion}, ${event.rubricVersion}, ${event.createdAt}
    )
    ON CONFLICT (id) DO NOTHING
  `;
}

export async function persistEvent(event: LearningEvent) {
  await writeOrThrow(event.studentId, async (tx) => {
    await insertLearningEvent(tx, event);
  });
}

export async function persistPlacement(
  studentId: string,
  topicId: string,
  state: string,
  rubricVersion: string,
) {
  await writeOrThrow(studentId, async (tx) => {
    await tx`
      INSERT INTO student_topic_placements (
        student_id, topic_id, state, rubric_version, curriculum_version, updated_at
      ) VALUES (
        ${studentId}, ${topicId}, ${state}, ${rubricVersion}, ${CURRICULUM_VERSION}, now()
      )
      ON CONFLICT (student_id, topic_id)
      DO UPDATE SET state = ${state}, rubric_version = ${rubricVersion}, updated_at = now()
    `;
  });
}

export async function persistPreference(studentId: string, startIntent: string) {
  await writeOrThrow(studentId, async (tx) => {
    await tx`
      INSERT INTO student_preferences (student_id, start_intent, updated_at)
      VALUES (${studentId}, ${startIntent}, now())
      ON CONFLICT (student_id)
      DO UPDATE SET start_intent = ${startIntent}, updated_at = now()
    `;
  });
}

export async function persistDiagnostic(
  session: {
    id: string;
    studentId: string;
    status: string;
    rubricVersion: string;
    curriculumVersion: string;
    itemIds: string[];
    createdAt: string;
    submittedAt?: string;
  },
  attempt?: DiagnosticAssessmentAttempt | null,
) {
  if (attempt && attempt.studentId !== session.studentId) {
    throw new LearningPersistError("missing_student_identity");
  }
  await writeOrThrow(session.studentId, async (tx) => {
    await tx`
      INSERT INTO diagnostic_sessions (
        id, student_id, status, rubric_version, curriculum_version, created_at, submitted_at
      ) VALUES (
        ${session.id}, ${session.studentId}, ${session.status}, ${session.rubricVersion},
        ${session.curriculumVersion}, ${session.createdAt}, ${session.submittedAt ?? null}
      )
      ON CONFLICT (id) DO UPDATE SET
        status = ${session.status},
        submitted_at = ${session.submittedAt ?? null}
    `;
    for (const [index, itemId] of session.itemIds.entries()) {
      await tx`
        INSERT INTO diagnostic_session_items (session_id, item_id, ordinal)
        VALUES (${session.id}, ${itemId}, ${index})
        ON CONFLICT DO NOTHING
      `;
    }
    if (attempt && session.status === "submitted") {
      await tx`
        INSERT INTO assessment_attempts (
          id, student_id, kind, session_id, rubric_version, curriculum_version, created_at
        ) VALUES (
          ${attempt.id}, ${session.studentId}, ${attempt.kind}, ${attempt.sessionId ?? session.id},
          ${attempt.rubricVersion}, ${attempt.curriculumVersion}, ${attempt.createdAt}
        )
        ON CONFLICT (id) DO NOTHING
      `;
    }
  });
}

export async function persistAnswer(answer: {
  sessionId: string;
  itemId: string;
  studentId: string;
  value: unknown;
  correct: boolean;
  method: string;
  topicId: string;
  createdAt: string;
}) {
  await writeOrThrow(answer.studentId, async (tx) => {
    await tx`
      INSERT INTO diagnostic_answers (
        session_id, item_id, student_id, response, correct, method, topic_id, created_at
      ) VALUES (
        ${answer.sessionId}, ${answer.itemId}, ${answer.studentId},
        ${tx.json({ value: answer.value })}, ${answer.correct}, ${answer.method},
        ${answer.topicId}, ${answer.createdAt}
      )
      ON CONFLICT (session_id, item_id) DO NOTHING
    `;
  });
}

function iso(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  return new Date(String(value)).toISOString();
}

export async function hydrateStudent(studentId: string) {
  if (hydrated.has(studentId)) return;
  if (learningStorageMode() === "memory") {
    hydrated.add(studentId);
    return;
  }
  const bundle = await withStudentTx(studentId, async (tx) => {
    const events = await tx`
      SELECT id, student_id, topic_id, lesson_id, kind, dimension, method,
             assisted, correct, curriculum_version, rubric_version, created_at
      FROM learning_events WHERE student_id = ${studentId}
      ORDER BY created_at
    `;
    const practice = await tx`
      SELECT id, student_id, assessment_id, attempt_no, earned, total, by_topic,
             responses, item_results, started_at, completed_at, idempotency_key
      FROM practice_assessment_attempts
      WHERE student_id = ${studentId}
      ORDER BY completed_at
    `;
    const attempts = await tx`
      SELECT id, student_id, kind, session_id, rubric_version, curriculum_version, created_at
      FROM assessment_attempts
      WHERE student_id = ${studentId}
      ORDER BY created_at
    `;
    const sessions = await tx`
      SELECT id, student_id, status, rubric_version, curriculum_version, created_at, submitted_at
      FROM diagnostic_sessions
      WHERE student_id = ${studentId}
      ORDER BY created_at
    `;
    const items = await tx`
      SELECT i.session_id, i.item_id, i.ordinal
      FROM diagnostic_session_items i
      JOIN diagnostic_sessions s ON s.id = i.session_id
      WHERE s.student_id = ${studentId}
      ORDER BY i.ordinal
    `;
    const answers = await tx`
      SELECT session_id, item_id, student_id, response, correct, method, topic_id, created_at
      FROM diagnostic_answers
      WHERE student_id = ${studentId}
      ORDER BY created_at
    `;
    const placements = await tx`
      SELECT topic_id, state, rubric_version
      FROM student_topic_placements
      WHERE student_id = ${studentId}
    `;
    return { events, practice, attempts, sessions, items, answers, placements };
  });

  const have = new Set(eventsForStudent(studentId).map((event) => event.id));
  for (const row of bundle.events) {
    if (have.has(row.id)) continue;
    addEvent({
      id: row.id,
      studentId: row.student_id,
      topicId: row.topic_id,
      lessonId: row.lesson_id ?? undefined,
      kind: row.kind,
      dimension: row.dimension,
      method: row.method ?? undefined,
      assisted: row.assisted,
      correct: row.correct ?? undefined,
      curriculumVersion: row.curriculum_version ?? CURRICULUM_VERSION,
      rubricVersion: row.rubric_version ?? PLACEMENT_RULES_VERSION,
      createdAt: iso(row.created_at),
    });
  }
  for (const row of bundle.practice) {
    rememberAttemptFromRow(row as Record<string, unknown>);
  }
  for (const row of bundle.attempts) {
    rememberAssessmentAttempt({
      id: String(row.id),
      studentId: String(row.student_id),
      kind: String(row.kind),
      sessionId: row.session_id ? String(row.session_id) : undefined,
      rubricVersion: String(row.rubric_version),
      curriculumVersion: String(row.curriculum_version),
      createdAt: iso(row.created_at),
    });
  }
  const itemsBySession = new Map<string, Array<{ itemId: string; ordinal: number }>>();
  for (const row of bundle.items) {
    const key = String(row.session_id);
    const list = itemsBySession.get(key) ?? [];
    list.push({ itemId: String(row.item_id), ordinal: Number(row.ordinal) });
    itemsBySession.set(key, list);
  }
  for (const row of bundle.sessions) {
    const itemIds = (itemsBySession.get(String(row.id)) ?? [])
      .sort((a, b) => a.ordinal - b.ordinal)
      .map((item) => item.itemId);
    const session: DiagnosticSession = {
      id: String(row.id),
      studentId: String(row.student_id),
      status: row.status === "submitted" ? "submitted" : "open",
      rubricVersion: String(row.rubric_version),
      curriculumVersion: String(row.curriculum_version),
      itemIds,
      createdAt: iso(row.created_at),
      submittedAt: row.submitted_at ? iso(row.submitted_at) : undefined,
    };
    rememberSession(session);
  }
  for (const row of bundle.answers) {
    const payload = row.response;
    const value =
      payload && typeof payload === "object" && "value" in (payload as Record<string, unknown>)
        ? (payload as { value: unknown }).value
        : payload;
    const answer: DiagnosticAnswer = {
      sessionId: String(row.session_id),
      itemId: String(row.item_id),
      studentId: String(row.student_id),
      value,
      correct: Boolean(row.correct),
      method: row.method as DiagnosticAnswer["method"],
      topicId: String(row.topic_id),
      createdAt: iso(row.created_at),
    };
    rememberAnswer(answer);
  }
  for (const row of bundle.placements) {
    setPlacement(studentId, String(row.topic_id), row.state as PlacementState, String(row.rubric_version));
  }
  hydrated.add(studentId);
}

export async function persistEventDurable(event: LearningEvent) {
  try {
    await persistEvent(event);
  } catch (error) {
    removeEvent(event.id);
    throw error;
  }
}

export async function assertLearningSchema() {
  const client = getSql();
  if (!client) throw new LearningPersistError("DATABASE_URL is not configured");
  const rows = await client`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN (
        'student_preferences', 'diagnostic_sessions', 'diagnostic_answers',
        'student_topic_placements', 'learning_events', 'assessment_attempts',
        'practice_assessment_attempts'
      )
  `;
  if (rows.length < 7) {
    throw new LearningPersistError("learning-state migrations are missing");
  }
}

export function resetHydration() {
  hydrated.clear();
}
