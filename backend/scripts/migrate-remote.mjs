import postgres from "postgres";
import { applyMigrations, inspectTarget, loadSteps, parseDatabaseUrl } from "./migrate-engine.mjs";

/**
 * Remote migrate is opt-in and refuses an empty target unless explicitly allowed.
 * This script does not load .env.local. Supply URLs in the environment.
 */
const url = process.env.MIGRATOR_DATABASE_URL;
if (!url) {
  console.error("MIGRATOR_DATABASE_URL is required");
  process.exit(1);
}
if (process.env.CFORGE_ALLOW_REMOTE_MIGRATE !== "1") {
  console.error("set CFORGE_ALLOW_REMOTE_MIGRATE=1 to migrate a non-loopback database");
  process.exit(1);
}

const identity = parseDatabaseUrl(url);
const confirm = process.env.CFORGE_CONFIRM_TARGET ?? "";
const expected = `${identity.host}/${identity.database}`;
if (confirm !== expected) {
  console.error(`CFORGE_CONFIRM_TARGET must exactly equal ${expected}`);
  process.exit(1);
}
if (["cforge_app", "cforge_faculty", "cforge_student"].includes(identity.user)) {
  console.error("migrate must use cforge_migrator, not a runtime login");
  process.exit(1);
}

const steps = await loadSteps();
console.log("planned:");
for (const step of steps) {
  console.log(`  ${step.id} ${step.file} ${step.checksum}`);
}

const sql = postgres(url, { max: 1, onnotice: () => undefined });
try {
  const state = await inspectTarget(sql);
  console.log(`empty=${state.empty} ledger=${state.hasLedger} tables=${state.tables.length}`);
  if (state.empty && process.env.CFORGE_ALLOW_EMPTY_TARGET !== "1") {
    console.error("refusing to migrate an empty remote database; restore the local dump first");
    process.exit(1);
  }
} finally {
  await sql.end({ timeout: 5 });
}

if (process.argv.includes("--dry-run")) {
  console.log("dry-run ok");
  process.exit(0);
}

const report = await applyMigrations(url, { steps, allowAnyTarget: true, allowNonEmpty: true });
for (const row of report.results) {
  console.log(`${row.status} ${row.id} ${row.checksum}`);
}
console.log("migrated");
