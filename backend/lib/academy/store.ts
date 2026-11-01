import { allJudgeExercises } from "./exercise-bank";
import type { ExerciseRow } from "./public-dto";

export type Student = {
  id: string;
  rollIdentifier: string;
  passwordHash: string;
  status: "active" | "revoked";
};

export type Invitation = {
  tokenHash: string;
  rollNumber: string;
  expiresAt: number;
  consumedBy?: string;
  revokedAt?: number;
};

export const SEAT_CAP = 55;

export class SeatCapError extends Error {
  code = "SEAT_CAP";
  constructor() {
    super("Active student seat cap reached");
  }
}

export class AcademyStore {
  students = new Map<string, Student>();
  studentsByRoll = new Map<string, Student>();
  invitations = new Map<string, Invitation>();
  exercises = new Map<string, ExerciseRow>(allJudgeExercises().map((row) => [row.id, row]));

  activeCount() {
    return [...this.students.values()].filter((s) => s.status === "active").length;
  }

  addInvitation(tokenHash: string, ttlMs: number, rollNumber: string) {
    this.invitations.set(tokenHash, {
      tokenHash,
      rollNumber,
      expiresAt: Date.now() + ttlMs,
    });
  }

  activeInvitationFor(rollNumber: string) {
    const now = Date.now();
    return [...this.invitations.values()].find(
      (row) =>
        row.rollNumber === rollNumber &&
        !row.consumedBy &&
        !row.revokedAt &&
        row.expiresAt > now,
    );
  }

  revokeInvitation(rollNumber: string) {
    const row = this.activeInvitationFor(rollNumber);
    if (!row) return false;
    row.revokedAt = Date.now();
    return true;
  }

  consumeInvitation(tokenHash: string, student: Student) {
    const invite = this.invitations.get(tokenHash);
    if (!invite) return { ok: false as const, reason: "invalid_invitation" };
    if (invite.revokedAt) return { ok: false as const, reason: "revoked_invitation" };
    if (invite.consumedBy) return { ok: false as const, reason: "already_registered" };
    if (invite.expiresAt < Date.now()) return { ok: false as const, reason: "invalid_invitation" };
    if (invite.rollNumber !== student.rollIdentifier) {
      return { ok: false as const, reason: "roll_mismatch" };
    }
    if (this.studentsByRoll.has(student.rollIdentifier)) {
      return { ok: false as const, reason: "already_registered" };
    }
    if (this.activeCount() >= SEAT_CAP && student.status === "active") {
      throw new SeatCapError();
    }
    invite.consumedBy = student.id;
    this.students.set(student.id, student);
    this.studentsByRoll.set(student.rollIdentifier, student);
    return { ok: true as const };
  }

  getExercise(id: string) {
    return this.exercises.get(id) ?? [...this.exercises.values()].find((row) => row.slug === id);
  }
}

const globalStore = globalThis as typeof globalThis & { __cforgeStore?: AcademyStore };

export function getStore() {
  if (!globalStore.__cforgeStore) {
    globalStore.__cforgeStore = new AcademyStore();
  }
  return globalStore.__cforgeStore;
}

export function resetStore() {
  globalStore.__cforgeStore = new AcademyStore();
  return globalStore.__cforgeStore;
}
