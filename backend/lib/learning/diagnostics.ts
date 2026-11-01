import { loadDiagnosticBank, gradeItem, publicItem, selectDiagnosticItems } from "./bank";
import { evaluatePlacement } from "./placement";
import {
  answersForSession,
  answersForStudent,
  assessmentAttemptForSession,
  completeSession,
  createSession,
  getPlacement,
  getSession,
  placementsFor,
  recordAnswer,
  sessionsFor,
  setPlacement,
} from "./store";
import { hydrateStudent, persistAnswer, persistDiagnostic, persistEvent, persistPlacement } from "./persist";
import { addEvent } from "./store";
import { PLACEMENT_RULES_VERSION, type PlacementMethod, type TopicEvidence } from "./types";

export async function startDiagnostic(studentId: string) {
  const items = selectDiagnosticItems();
  if (items.length === 0) {
    return { ok: false as const, status: 503, error: "diagnostic_bank_empty" };
  }
  const session = createSession(studentId, items);
  try {
    await persistDiagnostic(session);
  } catch {
    return { ok: false as const, status: 503, error: "LEARNING_PERSIST_FAILED" };
  }
  return {
    ok: true as const,
    session: {
      id: session.id,
      status: session.status,
      rubricVersion: session.rubricVersion,
      curriculumVersion: session.curriculumVersion,
      createdAt: session.createdAt,
      items: items.map(publicItem),
    },
  };
}

export function getDiagnosticPublic(studentId: string, sessionId: string) {
  const session = getSession(sessionId);
  if (!session) return { ok: false as const, status: 404, error: "not_found" };
  if (session.studentId !== studentId) return { ok: false as const, status: 404, error: "not_found" };
  const bank = loadDiagnosticBank();
  const items = session.itemIds
    .map((id) => bank.find((i) => i.id === id))
    .filter((i): i is NonNullable<typeof i> => Boolean(i))
    .map(publicItem);
  return {
    ok: true as const,
    session: {
      id: session.id,
      status: session.status,
      rubricVersion: session.rubricVersion,
      curriculumVersion: session.curriculumVersion,
      createdAt: session.createdAt,
      submittedAt: session.submittedAt,
      items,
    },
  };
}

export function listDiagnostics(studentId: string) {
  return sessionsFor(studentId).map((s) => ({
    id: s.id,
    status: s.status,
    rubricVersion: s.rubricVersion,
    createdAt: s.createdAt,
    submittedAt: s.submittedAt,
  }));
}

export async function submitDiagnostic(
  studentId: string,
  sessionId: string,
  answers: Array<{ itemId?: string; value?: unknown }>,
) {
  try {
    await hydrateStudent(studentId);
  } catch {
    return { ok: false as const, status: 503, error: "LEARNING_PERSIST_FAILED" };
  }
  const session = getSession(sessionId);
  if (!session) return { ok: false as const, status: 404, error: "not_found" };
  if (session.studentId !== studentId) return { ok: false as const, status: 404, error: "not_found" };
  if (session.status === "submitted") {
    try {
      await persistDiagnostic(session, assessmentAttemptForSession(sessionId) ?? null);
    } catch {
      return { ok: false as const, status: 503, error: "LEARNING_PERSIST_FAILED" };
    }
    return { ok: false as const, status: 409, error: "already_submitted" };
  }
  if (!Array.isArray(answers) || answers.length === 0) {
    return { ok: false as const, status: 400, error: "invalid_answers" };
  }

  const bank = loadDiagnosticBank();
  const allowed = new Set(session.itemIds);
  const graded: Array<{ itemId: string; correct: boolean; method: PlacementMethod; topicId: string }> = [];

  for (const raw of answers) {
    const row = { itemId: raw?.itemId, value: raw?.value };
    if (!row.itemId || !allowed.has(row.itemId)) {
      return { ok: false as const, status: 400, error: "unknown_item" };
    }
    const item = bank.find((i) => i.id === row.itemId);
    if (!item) return { ok: false as const, status: 400, error: "unknown_item" };
    const correct = gradeItem(item, row.value);
    const recorded = recordAnswer({
      sessionId,
      itemId: item.id,
      studentId,
      value: row.value,
      correct,
      method: item.method,
      topicId: item.topicId,
      createdAt: new Date().toISOString(),
    });
    if (recorded.duplicate) {
      return { ok: false as const, status: 409, error: "duplicate_answer", itemId: item.id };
    }
    try {
      await persistAnswer(recorded.answer);
    } catch {
      return { ok: false as const, status: 503, error: "LEARNING_PERSIST_FAILED" };
    }
    const event = addEvent({
      studentId,
      topicId: item.topicId,
      lessonId: item.lessonId,
      kind: "diagnostic",
      dimension: item.dimension,
      method: item.method,
      assisted: false,
      correct,
      rubricVersion: session.rubricVersion,
      curriculumVersion: session.curriculumVersion,
    });
    try {
      await persistEvent(event);
    } catch {
      return { ok: false as const, status: 503, error: "LEARNING_PERSIST_FAILED" };
    }
    graded.push({ itemId: item.id, correct, method: item.method, topicId: item.topicId });
  }

  completeSession(sessionId);
  const finished = getSession(sessionId);
  try {
    await persistDiagnostic(finished!, assessmentAttemptForSession(sessionId) ?? null);
  } catch {
    return { ok: false as const, status: 503, error: "LEARNING_PERSIST_FAILED" };
  }

  const placements = await applyPlacementFromAnswers(studentId);
  return {
    ok: true as const,
    sessionId,
    graded: graded.map((g) => ({ itemId: g.itemId, correct: g.correct, topicId: g.topicId })),
    placements,
    rubricVersion: PLACEMENT_RULES_VERSION,
  };
}

export async function applyPlacementFromAnswers(studentId: string) {
  const answers = answersForStudent(studentId);
  const topics = [...new Set(answers.map((a) => a.topicId))];
  const updates: Array<{ topicId: string; state: ReturnType<typeof getPlacement> }> = [];
  for (const topicId of topics) {
    const mine = answers.filter((a) => a.topicId === topicId);
    const methodsPassed = [...new Set(mine.filter((a) => a.correct).map((a) => a.method))];
    const methodsAttempted = [...new Set(mine.map((a) => a.method))];
    const evidence: TopicEvidence = {
      topicId,
      methodsPassed,
      methodsAttempted,
      previousState: getPlacement(studentId, topicId),
    };
    const state = evaluatePlacement(evidence);
    setPlacement(studentId, topicId, state, PLACEMENT_RULES_VERSION);
    await persistPlacement(studentId, topicId, state, PLACEMENT_RULES_VERSION);
    updates.push({ topicId, state });
  }
  return updates;
}

export function placementSnapshot(studentId: string) {
  return placementsFor(studentId);
}

export function answersUsedInSession(sessionId: string) {
  return answersForSession(sessionId).length;
}
