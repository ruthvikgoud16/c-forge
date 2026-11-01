import { facultyDbReady, withFacultyTx } from "@/lib/academy/db";
import { ensureVerifiedRosterNames, planFromVerifiedFile } from "./import";

/** Fill blank official names only. Never overwrites a stored display name. Does not create accounts. */
export async function persistBlankOfficialNames() {
  ensureVerifiedRosterNames();
  if (facultyDbReady() !== "postgres") return;
  const plan = planFromVerifiedFile();
  if (!plan.valid) return;
  try {
    await withFacultyTx(async (tx) => {
      for (const row of plan.rows) {
        await tx`
          UPDATE student_roster
          SET display_name = ${row.displayName}, updated_at = now()
          WHERE roll_number = ${row.rollNumber}
            AND display_name IS NULL
        `;
      }
    });
  } catch {
    return;
  }
}
