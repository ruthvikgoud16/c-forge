import { beforeEach, describe, expect, it } from "vitest";
import { GET as getOverview } from "@/app/api/v1/faculty/overview/route";
import { GET as getRoster, POST as postRoster } from "@/app/api/v1/faculty/roster/route";
import { GET as getInvites, POST as postInvite } from "@/app/api/v1/faculty/invitations/route";
import { resetStore, getStore, SEAT_CAP } from "@/lib/academy/store";
import { resetRoster, seedRoster } from "@/lib/roster/store";
import { resetLearningStore, addEvent, setPlacement } from "@/lib/learning/store";
import { recordAttempt, resetAssessments } from "@/lib/content/assess-store";
import { buildFacultyOverview, memoryAccounts } from "@/lib/faculty/overview";
import { COHORT_CAPACITY, officialRollNumbers } from "@/lib/roster/rolls";
import { facultyAuthorized } from "@/lib/faculty/auth";
import { closeSql } from "@/lib/academy/db";

const FACULTY = "test-faculty-token-2f5";

beforeEach(async () => {
  process.env.FACULTY_TOKEN = FACULTY;
  delete process.env.DATABASE_URL;
  await closeSql();
  resetStore();
  resetRoster();
  resetLearningStore();
  resetAssessments();
});

function facultyReq(path: string, init?: RequestInit) {
  return new Request(`http://127.0.0.1${path}`, {
    ...init,
    headers: { authorization: `Bearer ${FACULTY}`, "content-type": "application/json", ...init?.headers },
  });
}

function studentReq(path: string) {
  return new Request(`http://127.0.0.1${path}`, {
    headers: { cookie: "cforge_session=student-forged", authorization: "Bearer student-token" },
  });
}

describe("faculty dashboard 2F.5", () => {
  it("authorizes only the faculty Bearer token", () => {
    expect(facultyAuthorized(facultyReq("/api/v1/faculty/overview"))).toBe(true);
    expect(facultyAuthorized(studentReq("/api/v1/faculty/overview"))).toBe(false);
    expect(facultyAuthorized(new Request("http://127.0.0.1/api/v1/faculty/overview"))).toBe(false);
  });

  it("rejects student-shaped requests on faculty routes", async () => {
    expect((await getOverview(studentReq("/api/v1/faculty/overview"))).status).toBe(401);
    expect((await getRoster(studentReq("/api/v1/faculty/roster"))).status).toBe(401);
    expect((await getInvites(studentReq("/api/v1/faculty/invitations"))).status).toBe(401);
  });

  it("calculates 55-seat capacity from actual active accounts", () => {
    seedRoster();
    expect(officialRollNumbers()).toHaveLength(55);
    expect(COHORT_CAPACITY).toBe(55);
    expect(SEAT_CAP).toBe(55);
    const empty = buildFacultyOverview({
      accounts: [],
      events: [],
      attempts: [],
      placements: [],
      pendingInvitations: 2,
    });
    expect(empty.approvedRoster).toBe(55);
    expect(empty.activeStudents).toBe(0);
    expect(empty.availableSeats).toBe(55);
    expect(empty.pendingInvitations).toBe(2);
    expect(empty.inventedStudents).toBe(false);

    const full = buildFacultyOverview({
      accounts: officialRollNumbers().map((roll) => ({ rollIdentifier: roll, status: "active" as const })),
      events: [],
      attempts: [],
      placements: [],
      pendingInvitations: 0,
    });
    expect(full.activeStudents).toBe(55);
    expect(full.availableSeats).toBe(0);
  });

  it("updates a roster display name without changing the roll identity", async () => {
    seedRoster();
    const response = await postRoster(
      facultyReq("/api/v1/faculty/roster", {
        method: "POST",
        body: JSON.stringify({ updates: [{ rollNumber: "26eg104g01", displayName: "Ada Faculty" }] }),
      }),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { applied: Array<{ rollNumber: string; displayName: string }>; identityUnchanged: boolean };
    expect(body.identityUnchanged).toBe(true);
    expect(body.applied[0]).toEqual({ rollNumber: "26EG104G01", displayName: "Ada Faculty" });
    const listed = await getRoster(facultyReq("/api/v1/faculty/roster"));
    const roster = (await listed.json()) as { count: number; roster: Array<{ rollNumber: string; displayName: string | null }> };
    expect(roster.count).toBe(55);
    expect(roster.roster.find((row) => row.rollNumber === "26EG104G01")?.displayName).toBe("Ada Faculty");
  });

  it("aggregates only recorded events and suppresses tiny score cells", () => {
    addEvent({
      studentId: "a",
      topicId: "u1-t1",
      kind: "lesson_opened",
      dimension: "concept",
      assisted: false,
    });
    addEvent({
      studentId: "a",
      topicId: "u1-t1",
      kind: "knowledge_check",
      dimension: "concept",
      assisted: false,
      correct: false,
    });
    addEvent({
      studentId: "b",
      topicId: "u1-t1",
      kind: "lesson_opened",
      dimension: "concept",
      assisted: false,
    });
    setPlacement("a", "u1-t1", "NEEDS_REVISION");
    recordAttempt({
      studentId: "a",
      assessmentId: "topic:u1-t1",
      earned: 2,
      total: 4,
      byTopic: {},
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    });
    const overview = buildFacultyOverview({
      accounts: [
        { rollIdentifier: "26EG104G01", status: "active" },
        { rollIdentifier: "26EG104G02", status: "active" },
      ],
      events: [
        { studentId: "a", topicId: "u1-t1", kind: "lesson_opened" },
        { studentId: "a", topicId: "u1-t1", kind: "knowledge_check", correct: false },
        { studentId: "b", topicId: "u1-t1", kind: "lesson_opened" },
      ],
      attempts: [{ studentId: "a", assessmentId: "topic:u1-t1", earned: 2, total: 4 }],
      placements: [{ studentId: "a", topicId: "u1-t1", state: "NEEDS_REVISION" }],
      pendingInvitations: 0,
    });
    const unit1 = overview.unitProgress.find((row) => row.unitId === "unit-1" || row.unitId === "u1");
    const opened = overview.unitProgress.find((row) => row.studentsOpened === 2);
    expect(opened).toBeTruthy();
    expect(overview.assessments.distributionSuppressed).toBe(true);
    expect(overview.assessments.attemptCount).toBe(1);
    expect(overview.revisitTopics[0]?.topicId).toBe("u1-t1");
    expect(overview.revisitTopics[0]?.suppressed).toBe(true);
    expect(JSON.stringify(overview)).not.toContain("answer");
    expect(JSON.stringify(overview)).not.toContain("expectedStdout");
    void unit1;
    expect(memoryAccounts()).toEqual([]);
    expect(getStore().students.size).toBe(0);
  });

  it("mints invitations through the existing faculty workflow", async () => {
    const minted = await postInvite(
      facultyReq("/api/v1/faculty/invitations", {
        method: "POST",
        body: JSON.stringify({ ttlHours: 1, rollNumber: "26EG104G01" }),
      }),
    );
    expect(minted.status).toBe(201);
    const token = (await minted.json()) as { token: string };
    expect(token.token).toBeTruthy();
    const listed = await getInvites(facultyReq("/api/v1/faculty/invitations"));
    const body = (await listed.json()) as { pending: number; invitations: Array<{ consumed: boolean }> };
    expect(body.pending).toBe(1);
    expect(JSON.stringify(body)).not.toContain(token.token);
  });
});
