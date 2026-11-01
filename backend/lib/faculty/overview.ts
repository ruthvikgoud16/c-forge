import { FacultyPersistError, facultyDbReady, withFacultyTx } from "@/lib/academy/db";
import { getStore } from "@/lib/academy/store";
import { allAttempts } from "@/lib/content/assess-store";
import { officialUnits } from "@/lib/curriculum/catalog";
import { teachingTopicsForUnit } from "@/lib/learning/analytics";
import { allLearningEvents, allPlacements } from "@/lib/learning/store";
import { deriveState } from "@/lib/mastery/types";
import { COHORT_CAPACITY, officialRollNumbers } from "@/lib/roster/rolls";
import { ensureVerifiedRosterNames } from "@/lib/roster/import";
import { persistBlankOfficialNames } from "@/lib/roster/persist-verified";
import { listRosterAdmin, seedRoster } from "@/lib/roster/store";
import { listFacultyInvitations } from "./invitations";

const MIN_CELL = 3;

export type EventLite = {
  studentId: string;
  topicId: string;
  kind: string;
  correct?: boolean | null;
};

export type AttemptLite = {
  studentId: string;
  assessmentId: string;
  earned: number;
  total: number;
};

export type AccountLite = {
  rollIdentifier: string;
  status: "active" | "revoked";
};

function topicStateFromEvents(events: EventLite[], studentId: string, topicId: string) {
  const mine = events.filter((event) => event.studentId === studentId && event.topicId === topicId);
  const independent = mine.filter((e) => e.kind === "independent" || e.kind === "independent_write");
  const checks = mine.filter((e) => e.kind === "knowledge_check");
  const checkOk = checks.length > 0 && checks.every((e) => e.correct === true);
  return deriveState({
    opened: mine.some((e) => e.kind === "lesson_opened"),
    practised: mine.some((e) => e.kind === "guided" || e.kind === "independent" || e.kind === "knowledge_check"),
    assessmentPassed: checkOk || mine.some((e) => e.kind === "assessment_completed" && e.correct === true),
    independentOk: independent.some((e) => e.correct === true),
    retentionOk: checkOk,
  });
}

function bucketLabel(percent: number) {
  if (percent < 40) return "0–39";
  if (percent < 70) return "40–69";
  return "70–100";
}

export function buildFacultyOverview(input: {
  accounts: AccountLite[];
  events: EventLite[];
  attempts: AttemptLite[];
  placements: Array<{ studentId: string; topicId: string; state: string }>;
  pendingInvitations: number;
}) {
  seedRoster();
  const roster = listRosterAdmin();
  const approvedRoster = officialRollNumbers().length;
  const namedRoster = roster.filter((row) => Boolean(row.displayName?.trim())).length;
  const activeStudents = input.accounts.filter((row) => row.status === "active").length;
  const availableSeats = Math.max(0, COHORT_CAPACITY - activeStudents);

  const studentIds = new Set(input.events.map((event) => event.studentId));
  const unitProgress = officialUnits().map((unit) => {
    const topics = teachingTopicsForUnit(unit.id);
    const ids = topics.map((topic) => topic.id);
    let opened = 0;
    let practised = 0;
    let mastered = 0;
    for (const studentId of studentIds) {
      const states = ids.map((id) => topicStateFromEvents(input.events, studentId, id));
      if (states.some((state) => state === "started" || state === "practised" || state === "assessment_passed" || state === "mastered")) {
        opened += 1;
      }
      if (states.some((state) => state === "practised" || state === "assessment_passed" || state === "mastered")) {
        practised += 1;
      }
      if (states.some((state) => state === "mastered")) {
        mastered += 1;
      }
    }
    return {
      unitId: unit.id,
      title: unit.title,
      teachingTopics: ids.length,
      studentsOpened: opened,
      studentsPractised: practised,
      studentsMastered: mastered,
    };
  });

  const uniqueAttemptStudents = new Set(input.attempts.map((row) => row.studentId));
  const bucketCounts = { "0–39": 0, "40–69": 0, "70–100": 0 };
  for (const row of input.attempts) {
    if (row.total <= 0) continue;
    bucketCounts[bucketLabel(Math.round((row.earned / row.total) * 100))] += 1;
  }
  const assessments =
    uniqueAttemptStudents.size < MIN_CELL && input.attempts.length > 0
      ? {
          attemptCount: input.attempts.length,
          uniqueStudents: uniqueAttemptStudents.size,
          distributionSuppressed: true,
          reason: "n < 3 students; score slices omitted",
          buckets: [] as Array<{ label: string; count: number }>,
        }
      : {
          attemptCount: input.attempts.length,
          uniqueStudents: uniqueAttemptStudents.size,
          distributionSuppressed: false,
          buckets: Object.entries(bucketCounts).map(([label, count]) => ({ label, count })),
        };

  const revisit = new Map<string, Set<string>>();
  for (const event of input.events) {
    if (event.kind !== "knowledge_check" && event.kind !== "diagnostic") continue;
    if (event.correct !== false) continue;
    if (!revisit.has(event.topicId)) revisit.set(event.topicId, new Set());
    revisit.get(event.topicId)!.add(event.studentId);
  }
  for (const row of input.placements) {
    if (row.state !== "NEEDS_REVISION") continue;
    if (!revisit.has(row.topicId)) revisit.set(row.topicId, new Set());
    revisit.get(row.topicId)!.add(row.studentId);
  }
  const revisitTopics = [...revisit.entries()]
    .map(([topicId, students]) => ({
      topicId,
      studentCount: students.size < MIN_CELL ? null : students.size,
      suppressed: students.size < MIN_CELL,
    }))
    .sort((a, b) => (b.studentCount ?? 0) - (a.studentCount ?? 0) || a.topicId.localeCompare(b.topicId));

  return {
    cohortCapacity: COHORT_CAPACITY,
    approvedRoster,
    namedRoster,
    unnamedRoster: approvedRoster - namedRoster,
    activeStudents,
    pendingInvitations: input.pendingInvitations,
    availableSeats,
    remainingCapacity: availableSeats,
    unitProgress,
    assessments,
    revisitTopics,
    engagement: {
      eventCount: input.events.length,
      uniqueStudentsWithEvents: studentIds.size,
      lessonOpenedCount: input.events.filter((event) => event.kind === "lesson_opened").length,
      practiceEventCount: input.events.filter((event) =>
        event.kind === "guided" || event.kind === "independent" || event.kind === "knowledge_check",
      ).length,
    },
    inventedStudents: false,
    notes: [
      "Approved roster is official rolls only. Empty names are empty, not invented.",
      "Available seats are capacity minus active accounts, not unused roster names.",
      "Aggregates use recorded events and attempts only.",
    ],
  };
}

async function sqlAccounts(): Promise<AccountLite[] | null> {
  const mode = facultyDbReady();
  if (mode === "memory") return null;
  if (mode === "unavailable") throw new FacultyPersistError();
  try {
    return await withFacultyTx(async (tx) => {
      const rows = await tx`SELECT roll_identifier, status FROM students`;
      return rows.map((row) => ({
        rollIdentifier: String(row.roll_identifier),
        status: row.status === "revoked" ? "revoked" : "active",
      }));
    });
  } catch {
    return null;
  }
}

async function sqlEvents(): Promise<EventLite[] | null> {
  const mode = facultyDbReady();
  if (mode === "memory") return null;
  if (mode === "unavailable") throw new FacultyPersistError();
  try {
    return await withFacultyTx(async (tx) => {
      const rows = await tx`SELECT student_id, topic_id, kind, correct FROM learning_events`;
      return rows.map((row) => ({
        studentId: String(row.student_id),
        topicId: String(row.topic_id),
        kind: String(row.kind),
        correct: row.correct as boolean | null,
      }));
    });
  } catch {
    return null;
  }
}

async function sqlAttempts(): Promise<AttemptLite[] | null> {
  const mode = facultyDbReady();
  if (mode === "memory") return null;
  if (mode === "unavailable") throw new FacultyPersistError();
  try {
    return await withFacultyTx(async (tx) => {
      const rows = await tx`SELECT student_id, assessment_id, earned, total FROM practice_assessment_attempts`;
      return rows.map((row) => ({
        studentId: String(row.student_id),
        assessmentId: String(row.assessment_id),
        earned: Number(row.earned),
        total: Number(row.total),
      }));
    });
  } catch {
    return null;
  }
}

async function sqlPlacements() {
  const mode = facultyDbReady();
  if (mode === "memory") return null;
  if (mode === "unavailable") throw new FacultyPersistError();
  try {
    return await withFacultyTx(async (tx) => {
      const rows = await tx`SELECT student_id, topic_id, state FROM student_topic_placements`;
      return rows.map((row) => ({
        studentId: String(row.student_id),
        topicId: String(row.topic_id),
        state: String(row.state),
      }));
    });
  } catch {
    return null;
  }
}

export function memoryAccounts(): AccountLite[] {
  return [...getStore().students.values()].map((student) => ({
    rollIdentifier: student.rollIdentifier,
    status: student.status,
  }));
}

export function facultyStudentRows(accounts: AccountLite[]) {
  seedRoster();
  ensureVerifiedRosterNames();
  const byRoll = new Map(accounts.map((row) => [row.rollIdentifier, row]));
  return listRosterAdmin().map((row) => ({
    rollNumber: row.rollNumber,
    displayName: row.displayName,
    accountStatus: byRoll.get(row.rollNumber)?.status ?? "no_account",
  }));
}

export async function facultyOverviewPayload() {
  seedRoster();
  ensureVerifiedRosterNames();
  await persistBlankOfficialNames();
  const invitations = await listFacultyInvitations();
  const accounts = (await sqlAccounts()) ?? memoryAccounts();
  const events = (await sqlEvents()) ?? allLearningEvents();
  const attempts = (await sqlAttempts()) ?? allAttempts();
  const placements = (await sqlPlacements()) ?? allPlacements();
  return {
    ...buildFacultyOverview({
      accounts,
      events,
      attempts,
      placements,
      pendingInvitations: invitations.pending,
    }),
    students: facultyStudentRows(accounts),
    invitations: { pending: invitations.pending, consumed: invitations.consumed },
  };
}
