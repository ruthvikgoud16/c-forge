import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import postgres from "postgres";
import { loadEnvLocal } from "./load-env-local.mjs";
import { assertLocalCforgeTarget, parseDatabaseUrl } from "./migrate-engine.mjs";
import { resolvePgBin } from "./pg-bin.mjs";

loadEnvLocal();

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const source = assertLocalCforgeTarget(url);
const parsed = new URL(url);

const dir = process.env.CFORGE_BACKUP_DIR || path.join(os.homedir(), ".cforge", "backups");
const requested = process.argv[2];
const dumpPath = requested
  ? path.resolve(requested)
  : latestDump(dir);

if (!dumpPath.endsWith(".dump")) {
  console.error("backup file must be a .dump");
  process.exit(1);
}
if (dumpPath.startsWith(`${process.cwd()}/`)) {
  console.error("refusing to read a backup stored inside the Git working tree");
  process.exit(1);
}

const sumPath = `${dumpPath}.sha256`;
const expected = readFileSync(sumPath, "utf8").trim().split(/\s+/)[0];
const actual = createHash("sha256").update(readFileSync(dumpPath)).digest("hex");
if (actual !== expected) {
  console.error("checksum mismatch; restore aborted");
  process.exit(1);
}

const verifyName = `cforge_restore_verify_${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z").toLowerCase()}`;
if (verifyName === "cforge") {
  console.error("refusing to restore onto cforge");
  process.exit(1);
}

const adminUrl =
  process.env.ADMIN_DATABASE_URL ||
  `postgres://${encodeURIComponent(os.userInfo().username)}@127.0.0.1:${source.port}/postgres`;
const adminId = parseDatabaseUrl(adminUrl);
if (adminId.user === "cforge") {
  console.error("restore-verify must use the instance administrator, not cforge");
  process.exit(1);
}
if (adminId.host !== "127.0.0.1" && adminId.host !== "localhost" && adminId.host !== "::1") {
  console.error("restore-verify must use localhost");
  process.exit(1);
}

const admin = postgres(adminUrl, { max: 1, onnotice: () => undefined });
try {
  const existing = await admin`SELECT 1 FROM pg_database WHERE datname = 'cforge'`;
  if (!existing[0]) {
    console.error("original cforge is missing; aborting");
    process.exit(1);
  }
  const ownerRole = await admin`SELECT rolname FROM pg_roles WHERE rolname IN ('cforge_owner', 'cforge') ORDER BY rolname = 'cforge_owner' DESC`;
  const restoreOwner = ownerRole[0]?.rolname === "cforge_owner" ? "cforge_owner" : "cforge";
  await admin.unsafe(`CREATE DATABASE ${quoteIdent(verifyName)} OWNER ${restoreOwner} TEMPLATE template0`);
} finally {
  await admin.end({ timeout: 5 });
}

const pgRestore = resolvePgBin("pg_restore");
const env = { ...process.env };
delete env.DATABASE_URL;
delete env.ADMIN_DATABASE_URL;

// Superuser restore bypasses FORCE RLS on COPY. Objects keep dump ownership (cforge).
const restored = spawnSync(
  pgRestore,
  [
    "--no-password",
    `--dbname=${verifyName}`,
    `--host=${source.host}`,
    `--port=${source.port}`,
    `--username=${adminId.user}`,
    dumpPath,
  ],
  { env, encoding: "utf8" },
);

if (restored.status !== 0) {
  const err = (restored.stderr || restored.stdout || "pg_restore failed").replaceAll(password, "[redacted]");
  console.error(err.trim() || "pg_restore failed");
  process.exit(restored.status ?? 1);
}

function urlOnDatabase(raw, dbName) {
  const next = new URL(raw);
  next.pathname = `/${dbName}`;
  return next.toString();
}

const verifyAppUrl = urlOnDatabase(url, verifyName);
const sql = postgres(verifyAppUrl, { max: 1, onnotice: () => undefined });
const origin = postgres(url, { max: 1, onnotice: () => undefined });
const inspect = postgres(
  process.env.ADMIN_DATABASE_URL ||
    `postgres://${encodeURIComponent(os.userInfo().username)}@${source.host}:${source.port}/${verifyName}`,
  { max: 1, onnotice: () => undefined },
);
const originAdmin = postgres(
  process.env.ADMIN_DATABASE_URL ||
    `postgres://${encodeURIComponent(os.userInfo().username)}@${source.host}:${source.port}/cforge`,
  { max: 1, onnotice: () => undefined },
);
try {
  const who = await sql`SELECT current_database() AS db, current_user AS usr`;
  if (who[0].db === "cforge") {
    console.error("connected to cforge; aborting verification");
    process.exit(1);
  }
  const live = await origin`SELECT current_database() AS db, current_user AS usr`;
  if (live[0].db !== "cforge") {
    console.error("origin connection is not cforge");
    process.exit(1);
  }

  const ledger = await inspect`SELECT id, checksum FROM schema_migrations ORDER BY id`;
  const liveLedger = await originAdmin`SELECT id, checksum FROM schema_migrations ORDER BY id`;
  const tables = await inspect`SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY 1`;
  const exercises = await inspect`SELECT count(*)::int AS n FROM exercises`;
  const liveExercises = await originAdmin`SELECT count(*)::int AS n FROM exercises`;
  const tests = await inspect`SELECT count(*)::int AS n FROM exercise_tests`;
  const liveTests = await originAdmin`SELECT count(*)::int AS n FROM exercise_tests`;
  const rosterHidden = await sql`SELECT count(*)::int AS n FROM student_roster`;
  const owners = await inspect`
    SELECT c.relname, pg_get_userbyid(c.relowner) AS owner
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    ORDER BY 1
  `;
  const rls = await inspect`
    SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
      AND c.relname IN (
        'learning_events', 'practice_assessment_attempts',
        'student_roster', 'roster_name_audit', 'students'
      )
    ORDER BY 1
  `;
  const ping = await sql`SELECT 1 AS ok`;

  const tableNames = tables.map((row) => row.tablename);
  const required = [
    "schema_migrations",
    "students",
    "exercises",
    "student_roster",
    "practice_assessment_attempts",
    "learning_events",
  ];
  const missing = required.filter((name) => !tableNames.includes(name));
  const allowedOwners = new Set(["cforge", "cforge_owner"]);
  const badOwner = owners.filter((row) => !allowedOwners.has(row.owner)).map((row) => row.relname);
  const ok =
    ping[0]?.ok === 1 &&
    who[0].db === verifyName &&
    live[0].usr === "cforge_app" &&
    ledger.length === liveLedger.length &&
    exercises[0].n === liveExercises[0].n &&
    tests[0].n === liveTests[0].n &&
    rosterHidden[0].n === 0 &&
    missing.length === 0 &&
    badOwner.length === 0 &&
    rls.every((row) => row.relrowsecurity) &&
    rls.filter((row) => row.relname !== "students").every((row) => row.relforcerowsecurity);

  console.log(`restore_db=${verifyName}`);
  console.log(`checksum_ok=true sha256=${actual}`);
  console.log(`ledger_rows=${ledger.length}`);
  console.log(`tables=${tableNames.length}`);
  console.log(`exercises=${exercises[0].n} tests=${tests[0].n} roster_without_faculty=${rosterHidden[0].n}`);
  console.log(`owners_expected=${badOwner.length === 0}`);
  console.log(`rls_checked=${rls.length}`);
  console.log(`original_cforge_untouched=true`);
  console.log(`restore_ok=${ok}`);
  if (!ok) process.exit(1);
} finally {
  await sql.end({ timeout: 5 });
  await origin.end({ timeout: 5 });
  await inspect.end({ timeout: 5 });
  await originAdmin.end({ timeout: 5 });
}

function latestDump(backupDir) {
  const files = readdirSync(backupDir)
    .filter((name) => name.startsWith("cforge-") && name.endsWith(".dump"))
    .sort();
  if (!files.length) throw new Error("no backup dumps in backup directory");
  return path.join(backupDir, files[files.length - 1]);
}

function quoteIdent(name) {
  if (!/^[a-z_][a-z0-9_]*$/.test(name)) {
    throw new Error("unsafe database name");
  }
  return name;
}
