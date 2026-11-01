import { withStudentTx } from "./db";
import { getSql } from "./db";

export type Appearance = "light" | "dark";

export type StudentProfileRow = {
  dateOfBirth: string | null;
  appearance: Appearance | null;
};

const memory = new Map<string, StudentProfileRow>();

export function parseDateOfBirth(raw: unknown) {
  if (raw == null || raw === "") return { ok: true as const, value: null };
  if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return { ok: false as const, error: "invalid_date_of_birth" };
  }
  const [year, month, day] = raw.split("-").map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day!));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month! - 1 ||
    date.getUTCDate() !== day
  ) {
    return { ok: false as const, error: "invalid_date_of_birth" };
  }
  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  if (date.getTime() > todayUtc) return { ok: false as const, error: "invalid_date_of_birth" };
  if (year! < 1940) return { ok: false as const, error: "invalid_date_of_birth" };
  return { ok: true as const, value: raw };
}

export function parseAppearance(raw: unknown) {
  if (raw == null || raw === "") return { ok: true as const, value: null };
  if (raw === "light" || raw === "dark") return { ok: true as const, value: raw };
  return { ok: false as const, error: "invalid_appearance" };
}

function asIsoDate(value: unknown) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const text = String(value);
  return /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 10) : null;
}

export async function readStudentProfile(studentId: string): Promise<StudentProfileRow> {
  if (!getSql()) return memory.get(studentId) ?? { dateOfBirth: null, appearance: null };
  const rows = await withStudentTx(studentId, async (tx) => tx`
    SELECT date_of_birth, appearance
    FROM student_profiles
    WHERE student_id = ${studentId}
  `);
  const row = rows[0];
  return {
    dateOfBirth: asIsoDate(row?.date_of_birth),
    appearance: row?.appearance === "dark" || row?.appearance === "light" ? row.appearance : null,
  };
}

export async function writeStudentProfile(
  studentId: string,
  patch: { dateOfBirth?: string | null; appearance?: Appearance | null },
): Promise<StudentProfileRow> {
  const current = await readStudentProfile(studentId);
  const next: StudentProfileRow = {
    dateOfBirth: patch.dateOfBirth !== undefined ? patch.dateOfBirth : current.dateOfBirth,
    appearance: patch.appearance !== undefined ? patch.appearance : current.appearance,
  };
  if (!getSql()) {
    memory.set(studentId, next);
    return next;
  }
  await withStudentTx(studentId, async (tx) => {
    await tx`
      INSERT INTO student_profiles (student_id, date_of_birth, appearance, updated_at)
      VALUES (${studentId}, ${next.dateOfBirth}, ${next.appearance}, now())
      ON CONFLICT (student_id) DO UPDATE
      SET date_of_birth = EXCLUDED.date_of_birth,
          appearance = EXCLUDED.appearance,
          updated_at = now()
    `;
  });
  return next;
}
