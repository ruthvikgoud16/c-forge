import { describe, expect, it } from "vitest";
import {
  assertNoInvitationToken,
  mapFacultyInvitationCreate,
  mapFacultyInvitationList,
  mapFacultyOverview,
  mapFacultyRoster,
  rosterStatus,
} from "@/lib/faculty";

describe("faculty overview mapping", () => {
  it("reads official counts without inventing engagement", () => {
    const summary = mapFacultyOverview({
      cohortCapacity: 55,
      approvedRoster: 40,
      activeStudents: 10,
      pendingInvitations: 3,
      unitProgress: [{ unitId: "unit-1", title: "Introduction", studentsOpened: 4, studentsPractised: 2, studentsMastered: 1 }],
      assessments: { buckets: [{ label: "70–100", count: 5 }] },
      revisitTopics: [{ topicId: "u1-t1", studentCount: 3 }],
      engagement: { uniqueStudentsWithEvents: 8, eventCount: 21 },
    });
    expect(summary.capacity).toBe(55);
    expect(summary.notInvited).toBe(27);
    expect(summary.unitProgress[0]?.title).toBe("Introduction");
    expect(summary.unitProgress[0]?.needsPractice).toBe(4);
    expect(summary.unitProgress[0]?.demonstrated).toBe(2);
    expect(summary.engagement.map((row) => row.value)).toEqual([8, 21]);
  });
});

describe("faculty invitations", () => {
  it("maps list status and never keeps a token", () => {
    const list = mapFacultyInvitationList({
      invitations: [
        { rollNumber: "26EG104G01", expiresAt: "2099-01-01T00:00:00.000Z", consumed: false, revoked: false },
        { rollNumber: "26EG104G02", expiresAt: "2020-01-01T00:00:00.000Z", consumed: false, revoked: false },
        { rollNumber: "26EG104G03", expiresAt: "2099-01-01T00:00:00.000Z", consumed: true, revoked: false },
      ],
    });
    expect(list.map((row) => row.status)).toEqual(["pending", "expired", "accepted"]);
    expect(() => assertNoInvitationToken(list)).not.toThrow();
  });

  it("strips a create-response token", () => {
    const created = mapFacultyInvitationCreate({
      token: "secret-invite-token",
      rollNumber: "26EG104G01",
      expiresAt: "2099-01-01T00:00:00.000Z",
    });
    expect(created.rollNumber).toBe("26EG104G01");
    expect(created.status).toBe("pending");
    expect(JSON.stringify(created)).not.toMatch(/secret-invite-token/);
    expect(() => assertNoInvitationToken(created)).not.toThrow();
  });
});

describe("faculty roster mapping", () => {
  it("combines official roster rows with pending invitations", () => {
    const roster = mapFacultyRoster({
      students: [
        { rollNumber: "26EG104G01", displayName: "Ada", accountStatus: "active" },
        { rollNumber: "26EG104G02", displayName: "", accountStatus: "no_account" },
      ],
    }, [{ id: "26EG104G02", rollNumber: "26EG104G02", status: "pending", createdAt: "", expiresAt: "2099-01-01" }]);
    expect(roster[0]?.status).toBe("active");
    expect(roster[0]?.name).toBe("Ada");
    expect(roster[1]?.status).toBe("invited");
    expect(roster[1]?.name).toBe("26EG104G02");
    expect(rosterStatus("no_account", false)).toBe("not-invited");
  });
});
