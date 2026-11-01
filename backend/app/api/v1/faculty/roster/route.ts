import { json, readJsonBody } from "@/lib/academy/http";
import { getSql, withFacultyTx } from "@/lib/academy/db";
import { facultyAuthorized } from "@/lib/faculty/auth";
import { facultyFail } from "@/lib/faculty/http";
import { facultyOverviewPayload } from "@/lib/faculty/overview";
import { officialRollNumbers } from "@/lib/roster/rolls";
import { isOfficialRoll, normalizeRoll } from "@/lib/roster/rolls";
import { listRosterAdmin, seedRoster, updateRosterName } from "@/lib/roster/store";

export async function GET(request: Request) {
  if (!facultyAuthorized(request)) return json(401, { error: "unauthorized" });
  const seeded = seedRoster();
  try {
    const overview = await facultyOverviewPayload();
    return json(200, {
    roster: listRosterAdmin(),
    students: overview.students,
    count: officialRollNumbers().length,
    created: seeded.created,
    updated: seeded.updated,
    alreadyPresent: seeded.alreadyPresent,
    });
  } catch (error) {
    return facultyFail(error);
  }
}

export async function POST(request: Request) {
  if (!facultyAuthorized(request)) return json(401, { error: "unauthorized" });
  const parsed = await readJsonBody(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.value as {
    updates?: Array<{ rollNumber?: string; displayName?: string }>;
  } | null;
  if (!body?.updates?.length) return json(400, { error: "invalid_body" });
  const applied = [];
  for (const row of body.updates) {
    if (!row.rollNumber || !row.displayName) continue;
    const roll = normalizeRoll(row.rollNumber);
    const name = row.displayName.trim();
    if (!isOfficialRoll(roll) || !name) continue;
    const result = updateRosterName(roll, name, "faculty");
    if (!result.ok) continue;
    if (getSql()) {
      try {
      await withFacultyTx(async (tx) => {
        await tx`
          UPDATE student_roster
          SET display_name = ${name}, updated_at = now()
          WHERE roll_number = ${roll} AND display_name IS DISTINCT FROM ${name}
        `;
        await tx`
          INSERT INTO roster_name_audit (roll_number, previous_name, new_name, actor)
          VALUES (${roll}, ${result.row.displayName === name ? result.row.displayName : null}, ${name}, 'faculty')
        `;
      });
      } catch (error) {
        return facultyFail(error);
      }
    }
    applied.push({ rollNumber: roll, displayName: result.row.displayName });
  }
  return json(200, { applied, identityUnchanged: true });
}
