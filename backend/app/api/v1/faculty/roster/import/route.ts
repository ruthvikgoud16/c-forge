import { json } from "@/lib/academy/http";
import { facultyDbReady, getFacultySql } from "@/lib/academy/db";
import { facultyAuthorized } from "@/lib/faculty/auth";
import { facultyFail } from "@/lib/faculty/http";
import { FacultyPersistError } from "@/lib/academy/db";
// @ts-expect-error the roster planner is a checked .mjs module
import { applyRosterPlan } from "@/lib/roster/import-plan.mjs";
import { loadVerifiedRoster, planFromVerifiedFile } from "@/lib/roster/import";

function planFromVerifiedFileSafe() {
  try {
    return planFromVerifiedFile();
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  if (!facultyAuthorized(request)) return json(401, { error: "unauthorized" });
  let memory;
  try {
    memory = loadVerifiedRoster();
  } catch {
    return json(404, { error: "verified_roster_missing" });
  }
  const mode = facultyDbReady();
  if (mode === "unavailable") return facultyFail(new FacultyPersistError());
  if (mode === "postgres") {
    const plan = planFromVerifiedFileSafe();
    if (!plan) return json(200, { ...memory, postgres: null });
    const client = getFacultySql();
    if (!client) return facultyFail(new FacultyPersistError());
    const postgresResult = await applyRosterPlan(client, plan);
    return json(200, { ...memory, postgres: postgresResult });
  }
  return json(200, { ...memory, postgres: null });
}
