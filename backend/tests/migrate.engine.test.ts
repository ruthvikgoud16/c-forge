import { afterAll, describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import postgres from "postgres";
import EmbeddedPostgres from "embedded-postgres";
import { applyMigrations, MIGRATION_STEPS } from "../scripts/migrate-engine.mjs";

let liveUrl = "";
let embedded: EmbeddedPostgres | null = null;
let embeddedReady: boolean | null = null;

async function ensureEmbedded() {
  if (liveUrl) return liveUrl;
  if (embeddedReady === false) return "";
  try {
    const dir = mkdtempSync(join(tmpdir(), "cforge-migrate-pg-"));
    embedded = new EmbeddedPostgres({
      databaseDir: dir,
      user: "postgres",
      password: "cforge",
      port: 55435,
      persistent: false,
      autoRehydrateSymlinks: true,
    });
    await embedded.initialise();
    await embedded.start();
    liveUrl = "postgres://postgres:cforge@127.0.0.1:55435/postgres";
    embeddedReady = true;
    return liveUrl;
  } catch (error) {
    embeddedReady = false;
    console.warn("embedded postgres unavailable", error);
    return "";
  }
}

afterAll(async () => {
  if (embedded) await embedded.stop();
});

describe("migration engine", () => {
  it("plans runtime files only and keeps seed idempotent", () => {
    expect(MIGRATION_STEPS.map((step) => step.file)).toEqual([
      "db/schema.sql",
      "db/schema-learning.sql",
      "db/schema-roster.sql",
      "db/schema-assessments.sql",
      "db/seed.sql",
      "db/seed-exercises-2f3b.sql",
      "db/2026-10-31_007_faculty_dashboard.sql",
      "db/2026-10-31_008_roll_invitations.sql",
      "db/2026-10-31_009_faculty_role.sql",
      "db/2026-10-31_010_faculty_invite_policy.sql",
      "db/2026-10-31_011_faculty_students_policy.sql",
      "db/2026-10-31_012_runtime_access_functions.sql",
      "db/2026-10-31_013_owner_runtime_split.sql",
      "db/2026-10-31_014_rate_limit.sql",
      "db/2026-11-01_015_student_profiles.sql",
    ]);
    const rateLimit = readFileSync("db/2026-10-31_014_rate_limit.sql", "utf8");
    expect(rateLimit).toContain("academy_rate_limit_take");
    expect(rateLimit).toContain("SECURITY DEFINER");
    expect(rateLimit).toContain("SET search_path = pg_catalog, public");
    expect(rateLimit).toContain("GRANT EXECUTE ON FUNCTION academy_rate_limit_take");
    expect(rateLimit).toContain("cforge_faculty");
    expect(rateLimit).not.toMatch(/GRANT\s+BYPASSRLS/i);
    expect(rateLimit).not.toMatch(/ALTER\s+ROLE[\s\S]*SUPERUSER/i);
    expect(rateLimit).not.toMatch(/\bDROP\s+(TABLE|DATABASE)\b/i);
    const ownerSplit = readFileSync("db/2026-10-31_013_owner_runtime_split.sql", "utf8");
    expect(ownerSplit).toContain("cforge_owner");
    expect(ownerSplit).toContain("schema_migrations");
    expect(ownerSplit).not.toContain("REASSIGN OWNED");
    expect(ownerSplit).not.toMatch(/GRANT\s+BYPASSRLS/i);
    expect(ownerSplit).not.toMatch(/ALTER\s+ROLE[\s\S]*SUPERUSER/i);
    expect(ownerSplit).not.toMatch(/\bDROP\s+(TABLE|DATABASE)\b/i);
    const runtimeAccess = readFileSync("db/2026-10-31_012_runtime_access_functions.sql", "utf8");
    expect(runtimeAccess).toContain("SECURITY DEFINER");
    expect(runtimeAccess).toContain("SET search_path = pg_catalog, public");
    expect(runtimeAccess).toContain("academy_login_lookup");
    expect(runtimeAccess).toContain("academy_accept_invitation");
    expect(runtimeAccess).toContain("academy_exercise_tests");
    expect(runtimeAccess).toContain("REVOKE SELECT ON TABLE exercise_tests FROM cforge_app");
    expect(runtimeAccess).not.toMatch(/GRANT\s+SELECT\s+ON\s+TABLE\s+exercise_tests/i);
    expect(runtimeAccess).not.toMatch(/GRANT\s+BYPASSRLS/i);
    expect(runtimeAccess).not.toMatch(/ALTER\s+ROLE[\s\S]*SUPERUSER/i);
    expect(runtimeAccess).not.toMatch(/\bDROP\s+(TABLE|DATABASE)\b/i);
    expect(runtimeAccess).not.toContain("REASSIGN OWNED");
    const facultyRole = readFileSync("db/2026-10-31_009_faculty_role.sql", "utf8");
    expect(facultyRole).toContain("current_user = 'cforge_faculty'");
    expect(facultyRole).toContain("GRANT SELECT, UPDATE ON TABLE student_roster");
    expect(facultyRole).not.toMatch(/GRANT\s+BYPASSRLS/i);
    expect(facultyRole).not.toMatch(/ALTER\s+ROLE[\s\S]*SUPERUSER/i);
    expect(facultyRole).not.toMatch(/\bDROP\s+(TABLE|DATABASE)\b/i);
    const bound = readFileSync("db/2026-10-31_008_roll_invitations.sql", "utf8");
    expect(bound).toContain("roll_number");
    expect(bound).toContain("invitations_roll_roster_fk");
    expect(bound).not.toMatch(/\bDROP\s+(TABLE|DATABASE)\b/i);
    expect(bound).not.toContain("BYPASSRLS");
    expect(bound).not.toContain("SUPERUSER");
    const faculty = readFileSync("db/2026-10-31_007_faculty_dashboard.sql", "utf8");
    expect(faculty).not.toMatch(/\bDROP\s+(TABLE|DATABASE)\b/i);
    expect(faculty).toContain("generate_series(52, 55)");
    expect(faculty).toContain("active_count >= 55");
    expect(faculty).toContain("current_faculty()");
    expect(faculty).toContain("set_config('cforge.faculty'");
    expect(faculty).not.toContain("BYPASSRLS");
    expect(faculty).not.toContain("SUPERUSER");
    const seed = readFileSync("db/seed.sql", "utf8");
    expect(seed).toContain("ON CONFLICT (id) DO NOTHING");
    expect(seed).toContain("ON CONFLICT (exercise_id, ordinal) DO NOTHING");
    const expand = readFileSync("db/seed-exercises-2f3b.sql", "utf8");
    expect(expand).toContain("ON CONFLICT (id) DO NOTHING");
    expect(expand).toContain("ON CONFLICT (exercise_id, ordinal) DO NOTHING");
    expect(expand).not.toMatch(/\bDROP\s+(TABLE|DATABASE)\b/i);
    expect(expand).not.toMatch(/\bDELETE\b/i);
    expect(expand).not.toMatch(/\bTRUNCATE\b/i);
    const learning = readFileSync("db/schema-learning.sql", "utf8");
    expect(learning).not.toContain("WHEN others THEN NULL");
    expect(learning).toContain("SET LOCAL ROLE cforge_app");
    const roster = readFileSync("db/schema-roster.sql", "utf8");
    expect(roster).toContain("FORCE ROW LEVEL SECURITY");
    expect(roster).toContain("current_faculty()");
  });

  it(
    "applies twice, isolates students, and allows faculty GUC writes only",
    async () => {
      const url = await ensureEmbedded();
      if (!url) {
        console.warn("SKIP migrate engine live: embedded Postgres could not start");
        return;
      }
      const admin = postgres(url, { max: 1, onnotice: () => undefined });
      try {
        await admin.unsafe(readFileSync("db/provision-roles.sql", "utf8"));
        const first = await applyMigrations(url, { allowAnyTarget: true, allowNonEmpty: true });
        expect(first.results.every((row) => row.status === "applied")).toBe(true);
        expect(first.after.hasCurriculum).toBe(false);
        expect(first.after.tables).toContain("practice_assessment_attempts");
        expect(first.after.tables).toContain("schema_migrations");

        const second = await applyMigrations(url, { allowAnyTarget: true, allowNonEmpty: true });
        expect(second.results.every((row) => row.status === "skipped")).toBe(true);
        expect(second.results.map((row) => row.checksum)).toEqual(first.results.map((row) => row.checksum));

        const force = await admin`
          SELECT tablename, relforcerowsecurity
          FROM pg_tables t
          JOIN pg_class c ON c.relname = t.tablename
          JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.schemaname
          WHERE t.schemaname = 'public'
            AND t.tablename IN (
              'student_preferences', 'practice_assessment_attempts', 'student_roster'
            )
        `;
        expect(force.every((row) => row.relforcerowsecurity)).toBe(true);

        const exercises = await admin`SELECT count(*)::int AS n FROM exercises`;
        expect(exercises[0]?.n).toBe(22);

        const a = "11111111-1111-4111-8111-111111111101";
        const b = "11111111-1111-4111-8111-111111111102";
        await admin`INSERT INTO students (id, roll_identifier, password_hash, status)
          VALUES (${a}, '26EG104G01', 'x', 'active'), (${b}, '26EG104G02', 'x', 'active')`;

        await admin.begin(async (tx) => {
          await tx`SELECT set_config('cforge.student_id', ${a}, true)`;
          await tx.unsafe("SET LOCAL ROLE cforge_app");
          await tx`INSERT INTO learning_events (
            student_id, topic_id, kind, dimension, assisted, curriculum_version, rubric_version
          ) VALUES (${a}, 'u1-t2', 'lesson_opened', 'concept', false, 'v', '2d1-placement-v1')`;
        });

        const seenB = await admin.begin(async (tx) => {
          await tx`SELECT set_config('cforge.student_id', ${b}, true)`;
          await tx.unsafe("SET LOCAL ROLE cforge_app");
          return tx`SELECT student_id FROM learning_events`;
        });
        expect(seenB).toEqual([]);

        const denied = await admin.begin(async (tx) => {
          await tx`SELECT set_config('cforge.student_id', ${a}, true)`;
          await tx.unsafe("SET LOCAL ROLE cforge_app");
          return tx`UPDATE student_roster SET display_name = 'nope' WHERE roll_number = '26EG104G01' RETURNING display_name`;
        });
        expect(denied).toEqual([]);

        await expect(
          admin.begin(async (tx) => {
            await tx.unsafe("SET LOCAL ROLE cforge");
            await tx`SELECT set_config('cforge.faculty', '1', true)`;
            await tx`UPDATE student_roster SET display_name = 'Eve' WHERE roll_number = '26EG104G01' RETURNING display_name`;
          }),
        ).rejects.toThrow(/permission denied/);

        const owners = await admin`
          SELECT pg_get_userbyid(c.relowner) AS owner
          FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = 'public' AND c.relkind = 'r'
        `;
        expect(owners.every((row) => row.owner === "cforge_owner")).toBe(true);

        await admin.unsafe("ALTER ROLE cforge LOGIN PASSWORD 'cforge-test'");
        const parsed = new URL(url);
        parsed.username = "cforge";
        parsed.password = "cforge-test";
        const asCforge = postgres(parsed.toString(), { max: 1, onnotice: () => undefined });
        try {
          await expect(asCforge.unsafe("SET ROLE cforge_faculty")).rejects.toThrow();
        } finally {
          await asCforge.end({ timeout: 5 });
        }

        await admin.begin(async (tx) => {
          await tx.unsafe("SET LOCAL ROLE cforge_faculty");
          await tx`UPDATE student_roster SET display_name = 'Ada' WHERE roll_number = '26EG104G01'`;
        });
        const named = await admin.begin(async (tx) => {
          await tx.unsafe("SET LOCAL ROLE cforge_faculty");
          return tx`SELECT display_name FROM student_roster WHERE roll_number = '26EG104G01'`;
        });
        expect(named[0]?.display_name).toBe("Ada");

        const facultyRoles = await admin`
          SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = 'cforge_faculty'
        `;
        expect(facultyRoles[0]?.rolsuper).toBe(false);
        expect(facultyRoles[0]?.rolbypassrls).toBe(false);

        const defs = await admin`
          SELECT p.proname, p.prosecdef, p.proconfig
          FROM pg_proc p
          JOIN pg_namespace n ON n.oid = p.pronamespace
          WHERE n.nspname = 'public'
            AND p.proname IN ('academy_login_lookup', 'academy_accept_invitation', 'academy_exercise_tests', 'academy_rate_limit_take')
        `;
        expect(defs).toHaveLength(4);
        expect(defs.every((row) => row.prosecdef)).toBe(true);
        expect(defs.every((row) => (row.proconfig ?? []).some((item: string) => item.includes("pg_catalog")))).toBe(true);

        await expect(
          admin.begin(async (tx) => {
            await tx.unsafe("SET LOCAL ROLE cforge_app");
            await tx`SELECT expected_stdout FROM exercise_tests`;
          }),
        ).rejects.toThrow(/permission denied/);

        const viaFn = await admin.begin(async (tx) => {
          await tx.unsafe("SET LOCAL ROLE cforge_app");
          return tx`SELECT count(*)::int AS n FROM academy_exercise_tests(
            (SELECT id FROM exercises ORDER BY slug LIMIT 1)
          )`;
        });
        expect(viaFn[0]?.n).toBeGreaterThan(0);

        await expect(
          admin.begin(async (tx) => {
            await tx.unsafe("SET LOCAL ROLE cforge_faculty");
            await tx`SELECT * FROM academy_login_lookup('26EG104G01')`;
          }),
        ).rejects.toThrow(/permission denied/);

        await expect(
          admin.begin(async (tx) => {
            await tx.unsafe("SET LOCAL ROLE cforge_faculty");
            await tx`SELECT expected_stdout FROM exercise_tests`;
          }),
        ).rejects.toThrow(/permission denied/);

        await expect(
          admin.begin(async (tx) => {
            await tx`SELECT set_config('cforge.student_id', ${a}, true)`;
            await tx.unsafe("SET LOCAL ROLE cforge_app");
            await tx`SELECT password_hash FROM students`;
          }),
        ).rejects.toThrow(/permission denied/);

        const loginRow = await admin.begin(async (tx) => {
          await tx.unsafe("SET LOCAL ROLE cforge_app");
          return tx`SELECT roll_identifier, status FROM academy_login_lookup('26EG104G01')`;
        });
        expect(loginRow[0]?.roll_identifier).toBe("26EG104G01");

        await admin.begin(async (tx) => {
          await tx.unsafe("SET LOCAL ROLE cforge_faculty");
          await tx`INSERT INTO invitations (token_hash, expires_at, roll_number)
            VALUES ('accept-hash-g03', now() + interval '1 hour', '26EG104G03')`;
        });
        const accepted = await admin.begin(async (tx) => {
          await tx.unsafe("SET LOCAL ROLE cforge_app");
          return tx`SELECT error_code, roll_identifier FROM academy_accept_invitation(
            'accept-hash-g03', '26EG104G03', '11111111-1111-4111-8111-111111111103', 'hash'
          )`;
        });
        expect(accepted[0]?.error_code).toBeNull();
        expect(accepted[0]?.roll_identifier).toBe("26EG104G03");
        const replay = await admin.begin(async (tx) => {
          await tx.unsafe("SET LOCAL ROLE cforge_app");
          return tx`SELECT error_code FROM academy_accept_invitation(
            'accept-hash-g03', '26EG104G03', '11111111-1111-4111-8111-111111111199', 'hash'
          )`;
        });
        expect(replay[0]?.error_code).toBe("already_registered");
        const mismatch = await admin.begin(async (tx) => {
          await tx.unsafe("SET LOCAL ROLE cforge_faculty");
          await tx`INSERT INTO invitations (token_hash, expires_at, roll_number)
            VALUES ('mismatch-hash-g04', now() + interval '1 hour', '26EG104G04')`;
        });
        void mismatch;
        const wrongRoll = await admin.begin(async (tx) => {
          await tx.unsafe("SET LOCAL ROLE cforge_app");
          return tx`SELECT error_code FROM academy_accept_invitation(
            'mismatch-hash-g04', '26EG104G05', '11111111-1111-4111-8111-111111111104', 'hash'
          )`;
        });
        expect(wrongRoll[0]?.error_code).toBe("roll_mismatch");

        await admin.unsafe("ALTER ROLE cforge_app LOGIN PASSWORD 'cforge-app-test'");
        const appUrl = new URL(url);
        appUrl.username = "cforge_app";
        appUrl.password = "cforge-app-test";
        const asApp = postgres(appUrl.toString(), { max: 1, onnotice: () => undefined });
        try {
          await expect(asApp.unsafe("SET ROLE cforge")).rejects.toThrow();
          await expect(asApp.unsafe("SET ROLE cforge_faculty")).rejects.toThrow();
          await expect(asApp.unsafe("SET ROLE cforge_owner")).rejects.toThrow();
          await expect(asApp.unsafe("SET ROLE cforge_migrator")).rejects.toThrow();
          await expect(asApp.unsafe("ALTER TABLE students ADD COLUMN x int")).rejects.toThrow();
          await expect(
            asApp`INSERT INTO schema_migrations (id, checksum, applied_by) VALUES ('x', 'y', 'z')`,
          ).rejects.toThrow();
        } finally {
          await asApp.end({ timeout: 5 });
        }
      } finally {
        await admin.end();
      }
    },
    90_000,
  );
});
