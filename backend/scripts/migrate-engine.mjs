import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import postgres from "postgres";

export const MIGRATION_STEPS = [
  { id: "2026-10-31_001_schema", file: "db/schema.sql" },
  { id: "2026-10-31_002_learning", file: "db/schema-learning.sql" },
  { id: "2026-10-31_003_roster", file: "db/schema-roster.sql" },
  { id: "2026-10-31_004_assessments", file: "db/schema-assessments.sql" },
  { id: "2026-10-31_005_seed", file: "db/seed.sql" },
  { id: "2026-10-31_006_exercise_bank_2f3b", file: "db/seed-exercises-2f3b.sql" },
  { id: "2026-10-31_007_faculty_dashboard", file: "db/2026-10-31_007_faculty_dashboard.sql" },
  { id: "2026-10-31_008_roll_invitations", file: "db/2026-10-31_008_roll_invitations.sql" },
  { id: "2026-10-31_009_faculty_role", file: "db/2026-10-31_009_faculty_role.sql" },
  { id: "2026-10-31_010_faculty_invite_policy", file: "db/2026-10-31_010_faculty_invite_policy.sql" },
  { id: "2026-10-31_011_faculty_students_policy", file: "db/2026-10-31_011_faculty_students_policy.sql" },
  { id: "2026-10-31_012_runtime_access_functions", file: "db/2026-10-31_012_runtime_access_functions.sql" },
  { id: "2026-10-31_013_owner_runtime_split", file: "db/2026-10-31_013_owner_runtime_split.sql" },
  { id: "2026-10-31_014_rate_limit", file: "db/2026-10-31_014_rate_limit.sql" },
  { id: "2026-11-01_015_student_profiles", file: "db/2026-11-01_015_student_profiles.sql" },
];

const LEDGER = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  id text PRIMARY KEY,
  checksum text NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT now(),
  applied_by text NOT NULL
)
`;

function sha256(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function assertSafeSql(id, sql) {
  if (/\bDROP\s+DATABASE\b/i.test(sql) || /\bDROP\s+TABLE\b/i.test(sql)) {
    throw new Error(`${id} contains destructive DROP DATABASE/TABLE`);
  }
}

export function parseDatabaseUrl(url) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parsed.port || "5432",
    database: decodeURIComponent(parsed.pathname.replace(/^\//, "")),
    user: decodeURIComponent(parsed.username || ""),
  };
}

export function assertLocalCforgeTarget(url) {
  const id = parseDatabaseUrl(url);
  const loopback = id.host === "127.0.0.1" || id.host === "localhost" || id.host === "::1";
  if (!loopback || id.database !== "cforge") {
    throw new Error("DATABASE_URL must target local database cforge");
  }
  return id;
}

async function fileSql(file) {
  return readFile(new URL(`../${file}`, import.meta.url), "utf8");
}

export async function loadSteps() {
  const steps = [];
  for (const step of MIGRATION_STEPS) {
    const sql = await fileSql(step.file);
    assertSafeSql(step.id, sql);
    steps.push({ ...step, sql, checksum: sha256(sql) });
  }
  return steps;
}

export async function inspectTarget(sql) {
  const identity = await sql`
    SELECT current_database() AS db,
           current_user AS usr,
           inet_server_addr()::text AS addr,
           inet_server_port() AS port
  `;
  const tables = await sql`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `;
  const roles = await sql`
    SELECT rolname, rolsuper, rolbypassrls, rolcanlogin, rolcreaterole
    FROM pg_roles
    WHERE rolname IN (
      'cforge', 'cforge_app', 'cforge_student', 'cforge_faculty',
      'cforge_owner', 'cforge_migrator'
    )
    ORDER BY rolname
  `;
  const names = tables.map((row) => row.tablename);
  return {
    identity: identity[0],
    tables: names,
    roles,
    empty: names.length === 0,
    hasLedger: names.includes("schema_migrations"),
    hasCurriculum: names.includes("curriculum_versions"),
  };
}

export async function applyMigrations(url, options = {}) {
  if (!options.allowAnyTarget) assertLocalCforgeTarget(url);
  const steps = options.steps ?? (await loadSteps());
  const sql = postgres(url, { max: 1, onnotice: () => undefined });
  try {
    const before = await inspectTarget(sql);
    if (!before.hasLedger && !before.empty && !options.allowNonEmpty) {
      throw new Error("refusing to migrate a non-empty database without schema_migrations");
    }
    const app = before.roles.find((row) => row.rolname === "cforge_app");
    const student = before.roles.find((row) => row.rolname === "cforge_student");
    if (!app || !student) {
      throw new Error("cforge_app and cforge_student must exist; run npm run provision-roles as admin");
    }
    if (app.rolsuper || app.rolbypassrls) {
      throw new Error("cforge_app must not be SUPERUSER or BYPASSRLS");
    }
    if (["cforge_app", "cforge_faculty", "cforge_student"].includes(before.identity.usr)) {
      throw new Error("runtime roles cannot apply migrations");
    }

    const ownerReady = before.roles.some((row) => row.rolname === "cforge_owner");
    if (ownerReady) {
      try {
        await sql.unsafe("SET ROLE cforge_owner");
      } catch {
        throw new Error("migration identity cannot assume cforge_owner; use MIGRATOR_DATABASE_URL");
      }
    }

    await sql.unsafe(LEDGER);

    const results = [];
    for (const step of steps) {
      const existing = await sql`
        SELECT checksum FROM schema_migrations WHERE id = ${step.id}
      `;
      if (existing[0]) {
        if (existing[0].checksum !== step.checksum) {
          throw new Error(`checksum mismatch for ${step.id}`);
        }
        results.push({ id: step.id, status: "skipped", checksum: step.checksum });
        continue;
      }
      try {
        await sql.begin(async (tx) => {
          if (ownerReady) await tx.unsafe("SET LOCAL ROLE cforge_owner");
          await tx.unsafe(step.sql);
          await tx`
            INSERT INTO schema_migrations (id, checksum, applied_by)
            VALUES (${step.id}, ${step.checksum}, current_user)
          `;
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`migration ${step.id} failed: ${message}`);
      }
      results.push({ id: step.id, status: "applied", checksum: step.checksum });
    }
    const after = await inspectTarget(sql);
    return { results, before, after };
  } finally {
    await sql.end({ timeout: 5 });
  }
}
