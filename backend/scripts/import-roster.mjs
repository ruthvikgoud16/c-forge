import { readFileSync } from "node:fs";
import postgres from "postgres";
import { applyRosterPlan, planRosterImport } from "../lib/roster/import-plan.mjs";

const text = readFileSync(new URL("../db/cforge_verified_roster_2026-10-31.csv", import.meta.url), "utf8");
const plan = planRosterImport(text);

console.log(
  JSON.stringify(
    {
      file: "db/cforge_verified_roster_2026-10-31.csv",
      valid: plan.valid,
      uniqueRollCount: plan.uniqueRollCount,
      missing: plan.missing,
      rejected: plan.rejected,
    },
    null,
    2,
  ),
);

if (!plan.valid) process.exit(1);

const url = process.env.FACULTY_DATABASE_URL;
if (!url) {
  console.log("FACULTY_DATABASE_URL unset. No database rows were changed.");
  process.exit(0);
}

const sql = postgres(url, { max: 1 });
try {
  const present = await sql.unsafe("SELECT to_regclass('public.student_roster') AS rel");
  if (!present[0]?.rel) {
    console.error("student_roster is missing. Run npm run migrate first. No names were written.");
    process.exit(1);
  }
  const result = await applyRosterPlan(sql, plan);
  console.log(
    JSON.stringify(
      {
        applied: result.applied,
        updated: result.updated.length,
        unchanged: result.unchanged.length,
        missing: result.missing,
        rejected: result.rejected,
        auditInserted: result.auditInserted,
        activeStudents: result.activeStudents,
        studentsUnchanged: result.studentsUnchanged,
        updatedRolls: result.updated.map((row) => row.rollNumber),
      },
      null,
      2,
    ),
  );
} finally {
  await sql.end();
}
