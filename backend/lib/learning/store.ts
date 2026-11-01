import { randomUUID } from "node:crypto";
import type { BankItem } from "./bank";
import type { LearningEvent, PlacementState, StartIntent } from "./types";
import { CURRICULUM_VERSION, PLACEMENT_RULES_VERSION } from "./types";

export type DiagnosticSession = {
  id: string;
  studentId: string;
  status: "open" | "submitted";
  rubricVersion: string;
  curriculumVersion: string;
  itemIds: string[];
  createdAt: string;
  submittedAt?: string;
};

export type DiagnosticAnswer = {
  sessionId: string;
  itemId: string;
  studentId: string;
  value: unknown;
  correct: boolean;
  method: BankItem["method"];
  topicId: string;
  createdAt: string;
};

export type DiagnosticAssessmentAttempt = {
  id: string;
  studentId: string;
  kind: string;
  sessionId?: string;
  rubricVersion: string;
  curriculumVersion: string;
  createdAt: string;
};

type LearningMemory = {
  preferences: Map<string, StartIntent>;
  sessions: Map<string, DiagnosticSession>;
  answers: DiagnosticAnswer[];
  placements: Map<string, { state: PlacementState; rubricVersion: string; curriculumVersion: string }>;
  events: LearningEvent[];
  assessmentAttempts: DiagnosticAssessmentAttempt[];
};

const globalStore = globalThis as typeof globalThis & { __cforgeLearning?: LearningMemory };

function mem(): LearningMemory {
  if (!globalStore.__cforgeLearning) {
    globalStore.__cforgeLearning = {
      preferences: new Map(),
      sessions: new Map(),
      answers: [],
      placements: new Map(),
      events: [],
      assessmentAttempts: [],
    };
  }
  return globalStore.__cforgeLearning;
}

export function resetLearningStore() {
  globalStore.__cforgeLearning = undefined;
  mem();
}

export function setPreference(studentId: string, startIntent: StartIntent) {
  mem().preferences.set(studentId, startIntent);
}

export function getPreference(studentId: string) {
  return mem().preferences.get(studentId);
}

export function createSession(studentId: string, items: BankItem[]): DiagnosticSession {
  const session: DiagnosticSession = {
    id: randomUUID(),
    studentId,
    status: "open",
    rubricVersion: PLACEMENT_RULES_VERSION,
    curriculumVersion: CURRICULUM_VERSION,
    itemIds: items.map((i) => i.id),
    createdAt: new Date().toISOString(),
  };
  mem().sessions.set(session.id, session);
  return session;
}

export function getSession(id: string) {
  return mem().sessions.get(id);
}

export function rememberSession(session: DiagnosticSession) {
  const current = mem().sessions.get(session.id);
  if (current) return current;
  mem().sessions.set(session.id, session);
  return session;
}

export function sessionsFor(studentId: string) {
  return [...mem().sessions.values()]
    .filter((s) => s.studentId === studentId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function recordAnswer(answer: DiagnosticAnswer) {
  const existing = mem().answers.find((a) => a.sessionId === answer.sessionId && a.itemId === answer.itemId);
  if (existing) return { duplicate: true as const, answer: existing };
  mem().answers.push(answer);
  return { duplicate: false as const, answer };
}

export function rememberAnswer(answer: DiagnosticAnswer) {
  const existing = mem().answers.find((a) => a.sessionId === answer.sessionId && a.itemId === answer.itemId);
  if (existing) return existing;
  mem().answers.push(answer);
  return answer;
}

export function answersForSession(sessionId: string) {
  return mem().answers.filter((a) => a.sessionId === sessionId);
}

export function answersForStudent(studentId: string) {
  return mem().answers.filter((a) => a.studentId === studentId);
}

export function completeSession(sessionId: string) {
  const session = mem().sessions.get(sessionId);
  if (!session) return null;
  session.status = "submitted";
  session.submittedAt = new Date().toISOString();
  rememberAssessmentAttempt({
    id: randomUUID(),
    studentId: session.studentId,
    kind: "diagnostic",
    sessionId,
    rubricVersion: session.rubricVersion,
    curriculumVersion: session.curriculumVersion,
    createdAt: session.submittedAt,
  });
  return session;
}

export function rememberAssessmentAttempt(row: DiagnosticAssessmentAttempt) {
  const existing = mem().assessmentAttempts.find((attempt) => attempt.id === row.id);
  if (existing) return existing;
  mem().assessmentAttempts.push(row);
  return row;
}

export function assessmentAttemptsFor(studentId: string) {
  return mem().assessmentAttempts.filter((attempt) => attempt.studentId === studentId);
}

export function assessmentAttemptForSession(sessionId: string) {
  return mem().assessmentAttempts.find((attempt) => attempt.sessionId === sessionId);
}

function placeKey(studentId: string, topicId: string) {
  return `${studentId}:${topicId}`;
}

export function getPlacement(studentId: string, topicId: string): PlacementState {
  return mem().placements.get(placeKey(studentId, topicId))?.state ?? "NOT_ASSESSED";
}

export function setPlacement(
  studentId: string,
  topicId: string,
  state: PlacementState,
  rubricVersion = PLACEMENT_RULES_VERSION,
) {
  mem().placements.set(placeKey(studentId, topicId), {
    state,
    rubricVersion,
    curriculumVersion: CURRICULUM_VERSION,
  });
}

export function placementsFor(studentId: string) {
  const out: Array<{ topicId: string; state: PlacementState; rubricVersion: string }> = [];
  for (const [key, value] of mem().placements) {
    if (!key.startsWith(`${studentId}:`)) continue;
    out.push({ topicId: key.slice(studentId.length + 1), ...value });
  }
  return out;
}

export function addEvent(event: Omit<LearningEvent, "id" | "createdAt" | "curriculumVersion" | "rubricVersion"> & {
  id?: string;
  createdAt?: string;
  curriculumVersion?: string;
  rubricVersion?: string;
}) {
  const row: LearningEvent = {
    id: event.id ?? randomUUID(),
    studentId: event.studentId,
    topicId: event.topicId,
    lessonId: event.lessonId,
    kind: event.kind,
    dimension: event.dimension,
    method: event.method,
    assisted: event.assisted,
    correct: event.correct,
    curriculumVersion: event.curriculumVersion ?? CURRICULUM_VERSION,
    rubricVersion: event.rubricVersion ?? PLACEMENT_RULES_VERSION,
    createdAt: event.createdAt ?? new Date().toISOString(),
  };
  mem().events.push(row);
  return row;
}

export function eventsForStudent(studentId: string) {
  return mem().events.filter((e) => e.studentId === studentId);
}

export function allLearningEvents() {
  return [...mem().events];
}

export function allPlacements() {
  const out: Array<{ studentId: string; topicId: string; state: PlacementState }> = [];
  for (const [key, value] of mem().placements) {
    const split = key.indexOf(":");
    out.push({ studentId: key.slice(0, split), topicId: key.slice(split + 1), state: value.state });
  }
  return out;
}

export function eventsForTopic(studentId: string, topicId: string) {
  return eventsForStudent(studentId).filter((e) => e.topicId === topicId);
}

export function removeEvent(id: string) {
  const list = mem().events;
  const idx = list.findIndex((e) => e.id === id);
  if (idx >= 0) list.splice(idx, 1);
}
