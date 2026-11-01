import { loadEnvLocal } from "./load-env-local.mjs";
import { applyMigrations, assertLocalCforgeTarget, inspectTarget, loadSteps, parseDatabaseUrl } from "./migrate-engine.mjs";
import postgres from "postgres";

loadEnvLocal();

const url = process.env.MIGRATOR_DATABASE_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("MIGRATOR_DATABASE_URL or DATABASE_URL is required");
  process.exit(1);
}

const dryRun = process.argv.includes("--dry-run");
const identity = parseDatabaseUrl(url);
assertLocalCforgeTarget(url);
if (["cforge_app", "cforge_faculty", "cforge_student"].includes(identity.user)) {
  console.error("migrate must use cforge_migrator, not a runtime login");
  process.exit(1);
}
console.log(`target db=${identity.database} host=${identity.host} port=${identity.port} user=${identity.user}`);

const steps = await loadSteps();
console.log("planned:");
for (const step of steps) {
  console.log(`  ${step.id} ${step.file} ${step.checksum}`);
}
if (steps.some((step) => step.file.includes("curriculum"))) {
  console.error("curriculum must not be in the default plan");
  process.exit(1);
}

if (dryRun) {
  const sql = postgres(url, { max: 1, onnotice: () => undefined });
  try {
    const state = await inspectTarget(sql);
    console.log(`empty=${state.empty} ledger=${state.hasLedger} tables=${state.tables.length}`);
    console.log(`roles=${state.roles.map((row) => row.rolname).join(",") || "none"}`);
  } finally {
    await sql.end({ timeout: 5 });
  }
  console.log("dry-run ok");
  process.exit(0);
}

const report = await applyMigrations(url, { steps });
for (const row of report.results) {
  console.log(`${row.status} ${row.id} ${row.checksum}`);
}
console.log("migrated");
