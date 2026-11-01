import { FacultyPersistError, facultyDbReady, withFacultyTx } from "@/lib/academy/db";
import { getStore } from "@/lib/academy/store";

export type FacultyInvitationRow = {
  rollNumber: string;
  expiresAt: string;
  consumed: boolean;
  revoked: boolean;
  consumedByRoll: string | null;
};

export type FacultyInvitationList = {
  invitations: FacultyInvitationRow[];
  pending: number;
  consumed: number;
  revoked: number;
};

function fromMemory(): FacultyInvitationList {
  const store = getStore();
  const now = Date.now();
  const invitations: FacultyInvitationRow[] = [...store.invitations.values()].map((row) => ({
    rollNumber: row.rollNumber,
    expiresAt: new Date(row.expiresAt).toISOString(),
    consumed: Boolean(row.consumedBy),
    revoked: Boolean(row.revokedAt),
    consumedByRoll: row.consumedBy ? (store.students.get(row.consumedBy)?.rollIdentifier ?? row.rollNumber) : null,
  }));
  return summarize(invitations, now);
}

function summarize(invitations: FacultyInvitationRow[], nowMs = Date.now()): FacultyInvitationList {
  const pending = invitations.filter(
    (row) => !row.consumed && !row.revoked && Date.parse(row.expiresAt) > nowMs,
  ).length;
  const consumed = invitations.filter((row) => row.consumed).length;
  const revoked = invitations.filter((row) => row.revoked && !row.consumed).length;
  return { invitations, pending, consumed, revoked };
}

export async function listFacultyInvitations(): Promise<FacultyInvitationList> {
  const mode = facultyDbReady();
  if (mode === "memory") return fromMemory();
  if (mode === "unavailable") throw new FacultyPersistError();
  try {
    return await withFacultyTx(async (tx) => {
      const rows = await tx`
        SELECT i.roll_number, i.expires_at, i.consumed_at, i.revoked_at, s.roll_identifier
        FROM invitations i
        LEFT JOIN students s ON s.id = i.consumed_by
        ORDER BY i.expires_at DESC
      `;
      const invitations = rows.map((row) => ({
        rollNumber: row.roll_number ? String(row.roll_number) : "",
        expiresAt: row.expires_at instanceof Date ? row.expires_at.toISOString() : String(row.expires_at),
        consumed: Boolean(row.consumed_at),
        revoked: Boolean(row.revoked_at),
        consumedByRoll: row.roll_identifier ? String(row.roll_identifier) : null,
      }));
      return summarize(invitations);
    });
  } catch {
    return fromMemory();
  }
}
