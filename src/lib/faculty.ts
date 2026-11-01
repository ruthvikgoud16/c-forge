import type { AccountStatus, FacultySummary, Invitation, InvitationStatus, RosterEntry, UnitId } from "@/domain/types";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function field(row: Record<string, unknown>, key: string) {
  return row[key];
}

function text(value: unknown, fallback = "") {
  return value == null || value === "" ? fallback : String(value);
}

export function invitationStatus(row: { consumed: boolean; revoked: boolean; expiresAt: string }): InvitationStatus {
  if (row.consumed) return "accepted";
  if (row.revoked) return "revoked";
  if (Date.parse(row.expiresAt) <= Date.now()) return "expired";
  return "pending";
}

export function assertNoInvitationToken(payload: unknown) {
  if (/"token"\s*:/.test(JSON.stringify(payload))) throw new Error("invitation token leaked");
}

export function mapFacultyInvitation(raw: unknown): Invitation | null {
  const row = asRecord(raw);
  const rollNumber = text(field(row, "rollNumber"));
  if (!rollNumber) return null;
  const expiresAt = text(field(row, "expiresAt"));
  const mapped: Invitation = {
    id: rollNumber,
    rollNumber,
    status: invitationStatus({
      consumed: field(row, "consumed") === true,
      revoked: field(row, "revoked") === true,
      expiresAt,
    }),
    createdAt: "",
    expiresAt: expiresAt.slice(0, 10),
  };
  assertNoInvitationToken(mapped);
  return mapped;
}

export function mapFacultyInvitationCreate(raw: unknown): Invitation {
  const row = asRecord(raw);
  const { token: _token, ...safe } = row;
  const mapped = mapFacultyInvitation({ ...safe, consumed: false, revoked: false });
  if (!mapped) throw new Error("invitation create response missing roll number");
  assertNoInvitationToken(mapped);
  return mapped;
}

export function mapFacultyInvitationList(raw: unknown): Invitation[] {
  const row = asRecord(raw);
  const invitations = field(row, "invitations");
  return Array.isArray(invitations)
    ? invitations.map(mapFacultyInvitation).filter((item): item is Invitation => item !== null)
    : [];
}

function asUnitId(id: string): UnitId {
  if (id === "unit-1" || id === "unit-2" || id === "unit-3" || id === "unit-4" || id === "unit-5") return id;
  return "unit-1";
}

export function mapFacultyOverview(raw: unknown): FacultySummary {
  const body = asRecord(raw);
  if (field(body, "error")) {
    throw new Error("The faculty overview API did not return cohort counts.");
  }
  if (!("approvedRoster" in body) && !("students" in body) && !("cohortCapacity" in body)) {
    throw new Error("The faculty overview API did not return cohort counts.");
  }
  const unitProgress = field(body, "unitProgress");
  const assessments = asRecord(field(body, "assessments"));
  const buckets = field(assessments, "buckets");
  const revisit = field(body, "revisitTopics");
  const engagement = asRecord(field(body, "engagement"));
  const rosterCount = Number(field(body, "approvedRoster") ?? 0);
  const active = Number(field(body, "activeStudents") ?? 0);
  const invited = Number(field(body, "pendingInvitations") ?? 0);
  return {
    capacity: Number(field(body, "cohortCapacity") ?? 0),
    rosterCount,
    active,
    invited,
    notInvited: Math.max(0, rosterCount - active - invited),
    unitProgress: Array.isArray(unitProgress)
      ? unitProgress.map((unit) => {
          const item = asRecord(unit);
          return {
            unitId: asUnitId(text(field(item, "unitId"))),
            title: text(field(item, "title")),
            mastered: Number(field(item, "studentsMastered") ?? 0),
            demonstrated: Number(field(item, "studentsPractised") ?? 0),
            needsPractice: Number(field(item, "studentsOpened") ?? 0),
          };
        })
      : [],
    assessmentBuckets: Array.isArray(buckets)
      ? buckets.map((bucket) => {
          const item = asRecord(bucket);
          const count = field(item, "count");
          return { label: text(field(item, "label")), count: count == null ? null : Number(count) };
        })
      : [],
    revisitTopics: Array.isArray(revisit)
      ? revisit.map((topic) => {
          const item = asRecord(topic);
          const students = field(item, "studentCount");
          return { topicId: text(field(item, "topicId")), students: students == null ? null : Number(students) };
        })
      : [],
    engagement: [
      { label: "Students with activity", value: Number(field(engagement, "uniqueStudentsWithEvents") ?? 0) },
      { label: "Learning events", value: Number(field(engagement, "eventCount") ?? 0) },
    ],
  };
}

export function rosterStatus(accountStatus: string, pending: boolean): AccountStatus {
  if (accountStatus === "active") return "active";
  if (pending) return "invited";
  return "not-invited";
}

export function mapFacultyRoster(raw: unknown, invitations: Invitation[]): RosterEntry[] {
  const body = asRecord(raw);
  const students = field(body, "students") ?? field(body, "roster");
  const pending = new Set(invitations.filter((row) => row.status === "pending").map((row) => row.rollNumber));
  if (!Array.isArray(students)) {
    throw new Error("The faculty roster API did not return students.");
  }
  return students.map((student) => {
    const item = asRecord(student);
    const rollNumber = text(field(item, "rollNumber"));
    const invite = invitations.find((row) => row.rollNumber === rollNumber);
    return {
      id: rollNumber,
      rollNumber,
      name: text(field(item, "displayName"), rollNumber),
      status: rosterStatus(text(field(item, "accountStatus")), pending.has(rollNumber)),
      invitation: invite,
    };
  }).filter((row) => row.rollNumber);
}
