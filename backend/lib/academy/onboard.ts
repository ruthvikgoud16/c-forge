import { randomUUID } from "node:crypto";
import { hashPassword, sha256, verifyPassword, randomToken } from "./crypto";
import { FacultyPersistError, getSql, requireFacultyDbIfAppDb, withAppTx, withFacultyTx } from "./db";
import { SeatCapError, getStore, type Student } from "./store";
import { loadEnv } from "./env";
import { isOfficialRoll, normalizeRoll } from "@/lib/roster/rolls";
import { seedRoster } from "@/lib/roster/store";

export function validatePassword(password: string) {
  return password.length >= 10;
}

export function validateRoll(rollIdentifier: string) {
  return /^[\p{L}\p{N}._-]{1,64}$/u.test(rollIdentifier);
}

function officialUnboundRoll(rollIdentifier: string) {
  seedRoster();
  if (!validateRoll(rollIdentifier) || !isOfficialRoll(rollIdentifier)) {
    return { ok: false as const, status: 400, error: "unknown_roll" };
  }
  return { ok: true as const, roll: rollIdentifier };
}

export async function acceptInvite(input: {
  token: string;
  rollIdentifier: string;
  password: string;
}) {
  const rawToken = typeof input.token === "string" ? input.token : "";
  const requested = normalizeRoll(input.rollIdentifier);
  const official = officialUnboundRoll(requested);
  if (!official.ok) return official;
  if (!rawToken) {
    return { ok: false as const, status: 400, error: "invalid_invitation" };
  }
  if (!validatePassword(input.password)) {
    return { ok: false as const, status: 400, error: "weak_password" };
  }

  const client = getSql();
  if (client) {
    try {
      const created = await withAppTx(async (tx) => {
        const tokenHash = sha256(rawToken);
        const studentId = randomUUID();
        const passwordHash = hashPassword(input.password);
        const rows = await tx`
          SELECT error_code, student_id, roll_identifier
          FROM academy_accept_invitation(
            ${tokenHash},
            ${official.roll},
            ${studentId},
            ${passwordHash}
          )
        `;
        const row = rows[0];
        if (!row) return { error: "invalid_invitation" as const };
        if (row.error_code) return { error: String(row.error_code) as typeof row.error_code };
        return { id: String(row.student_id), rollIdentifier: String(row.roll_identifier) };
      });
      if ("error" in created) {
        const status = created.error === "already_registered" ? 409 : 400;
        return { ok: false as const, status, error: created.error };
      }
      return {
        ok: true as const,
        student: {
          id: created.id,
          rollIdentifier: created.rollIdentifier,
          passwordHash: "",
          status: "active" as const,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.includes("SEAT_CAP") || message.includes("students_seat_cap")) {
        return { ok: false as const, status: 409, error: "SEAT_CAP" };
      }
      if (message.includes("unique") || message.includes("duplicate")) {
        return { ok: false as const, status: 409, error: "already_registered" };
      }
      return { ok: false as const, status: 400, error: "invalid_invitation" };
    }
  }

  const env = loadEnv();
  const store = getStore();
  const tokenHash = sha256(input.token);
  const devOk =
    env.allowDevInvite && env.devInviteToken && input.token === env.devInviteToken;
  if (devOk && !store.invitations.has(tokenHash)) {
    if (store.studentsByRoll.has(official.roll) || store.activeInvitationFor(official.roll)) {
      return { ok: false as const, status: 409, error: "already_registered" };
    }
    store.addInvitation(tokenHash, 24 * 60 * 60 * 1000, official.roll);
  }

  const student: Student = {
    id: randomUUID(),
    rollIdentifier: official.roll,
    passwordHash: hashPassword(input.password),
    status: "active",
  };

  try {
    const consumed = store.consumeInvitation(tokenHash, student);
    if (!consumed.ok) {
      const status = consumed.reason === "already_registered" ? 409 : 400;
      return { ok: false as const, status, error: consumed.reason };
    }
  } catch (error) {
    if (error instanceof SeatCapError) {
      return { ok: false as const, status: 409, error: "SEAT_CAP" };
    }
    throw error;
  }

  return { ok: true as const, student };
}

const LOGIN_TIMING_HASH = hashPassword("cforge-unknown-login-timing");

export async function loginStudent(rollIdentifier: string, password: string) {
  const roll = normalizeRoll(rollIdentifier);
  const client = getSql();
  if (client) {
    const rows = await withAppTx(async (tx) => tx`SELECT * FROM academy_login_lookup(${roll})`);
    const row = rows[0];
    const hash = row?.status === "active" ? String(row.password_hash) : LOGIN_TIMING_HASH;
    if (!verifyPassword(password, hash) || !row || row.status !== "active") return null;
    return {
      id: row.id,
      rollIdentifier: row.roll_identifier,
      passwordHash: row.password_hash,
      status: "active" as const,
    };
  }

  const student = getStore().studentsByRoll.get(roll);
  const hash = student?.status === "active" ? student.passwordHash : LOGIN_TIMING_HASH;
  if (!verifyPassword(password, hash) || !student || student.status !== "active") return null;
  return student;
}

export async function mintInvitation(rollRaw: string, ttlHours: number) {
  const roll = normalizeRoll(rollRaw ?? "");
  const official = officialUnboundRoll(roll);
  if (!official.ok) return official;
  const token = randomToken();
  const hours = Math.min(Math.max(ttlHours || 168, 1), 720);
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

  if (getSql()) {
    try {
      requireFacultyDbIfAppDb();
      await withFacultyTx(async (tx) => {
        const roster = await tx`
          SELECT roll_number FROM student_roster WHERE roll_number = ${official.roll}
        `;
        if (!roster[0]) throw Object.assign(new Error("unknown_roll"), { code: "unknown_roll" });
        const student = await tx`
          SELECT id FROM students WHERE roll_identifier = ${official.roll}
        `;
        if (student[0]) throw Object.assign(new Error("already_registered"), { code: "already_registered" });
        await tx`
          UPDATE invitations
          SET revoked_at = now()
          WHERE roll_number = ${official.roll}
            AND consumed_at IS NULL
            AND revoked_at IS NULL
            AND expires_at <= now()
        `;
        const active = await tx`
          SELECT id FROM invitations
          WHERE roll_number = ${official.roll}
            AND consumed_at IS NULL
            AND revoked_at IS NULL
            AND expires_at > now()
          FOR UPDATE
        `;
        if (active[0]) throw Object.assign(new Error("duplicate_invitation"), { code: "duplicate_invitation" });
        await tx`
          INSERT INTO invitations (token_hash, expires_at, roll_number)
          VALUES (${sha256(token)}, ${expiresAt}, ${official.roll})
        `;
      });
    } catch (error) {
      const code = error instanceof Error ? (error as Error & { code?: string }).code ?? error.message : "";
      if (code.includes("unknown_roll")) return { ok: false as const, status: 400, error: "unknown_roll" };
      if (code.includes("already_registered")) return { ok: false as const, status: 409, error: "already_registered" };
      if (code.includes("duplicate_invitation")) return { ok: false as const, status: 409, error: "duplicate_invitation" };
      if (error instanceof FacultyPersistError) {
        return { ok: false as const, status: 503, error: error.code };
      }
      throw error;
    }
  } else {
    const store = getStore();
    if (store.studentsByRoll.has(official.roll)) {
      return { ok: false as const, status: 409, error: "already_registered" };
    }
    if (store.activeInvitationFor(official.roll)) {
      return { ok: false as const, status: 409, error: "duplicate_invitation" };
    }
    store.addInvitation(sha256(token), hours * 60 * 60 * 1000, official.roll);
  }

  return { ok: true as const, token, expiresAt: expiresAt.toISOString(), rollNumber: official.roll };
}

export async function revokeInvitation(rollRaw: string) {
  const roll = normalizeRoll(rollRaw ?? "");
  const official = officialUnboundRoll(roll);
  if (!official.ok) return official;

  if (getSql()) {
    try {
      requireFacultyDbIfAppDb();
    } catch (error) {
      if (error instanceof FacultyPersistError) {
        return { ok: false as const, status: 503, error: error.code };
      }
      throw error;
    }
    const updated = await withFacultyTx(async (tx) => {
      return tx`
        UPDATE invitations
        SET revoked_at = now()
        WHERE roll_number = ${official.roll}
          AND consumed_at IS NULL
          AND revoked_at IS NULL
          AND expires_at > now()
        RETURNING id
      `;
    });
    if (!updated[0]) return { ok: false as const, status: 404, error: "not_found" };
    return { ok: true as const, rollNumber: official.roll, revoked: true };
  }

  if (!getStore().revokeInvitation(official.roll)) {
    return { ok: false as const, status: 404, error: "not_found" };
  }
  return { ok: true as const, rollNumber: official.roll, revoked: true };
}
