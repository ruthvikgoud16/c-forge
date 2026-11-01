import { afterAll, describe, expect, it } from "vitest";
import { readFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import postgres from "postgres";
import EmbeddedPostgres from "embedded-postgres";

const REQUIRED_TABLES = [
  "student_preferences",
  "diagnostic_sessions",
  "diagnostic_answers",
  "student_topic_placements",
  "learning_events",
];

let liveUrl = process.env.DATABASE_URL ?? "";
let embedded: EmbeddedPostgres | null = null;
let embeddedReady: boolean | null = null;

async function ensureEmbedded() {
  if (liveUrl) return liveUrl;
  if (embeddedReady === false) return "";
  if (embedded) return liveUrl;
  try {
    const dir = mkdtempSync(join(tmpdir(), "cforge-pg-"));
    embedded = new EmbeddedPostgres({
      databaseDir: dir,
      user: "postgres",
      password: "cforge",
      port: 55433,
      persistent: false,
      autoRehydrateSymlinks: true,
    });
    await embedded.initialise();
    await embedded.start();
    liveUrl = "postgres://postgres:cforge@127.0.0.1:55433/postgres";
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

describe("learning-state PostgreSQL", () => {
  it("ships FORCE RLS, catalog text topic ids, and no global skill label", () => {
    const sql = readFileSync("db/schema-learning.sql", "utf8");
    expect(sql).toContain("FORCE ROW LEVEL SECURITY");
    expect(sql).toContain("topic_id text");
    expect(sql).toContain("SET LOCAL");
    expect(sql).toContain("cforge_app");
    expect(sql).not.toMatch(/beginner|intermediate|advanced/);
    const legacy = readFileSync("db/schema-curriculum.sql", "utf8");
    expect(legacy).toContain("mastery_events");
    expect(legacy).toContain("-- Curriculum foundation");
  });

  it(
    "isolates two students as cforge_app with transaction-local identity",
    async () => {
      const url = await ensureEmbedded();
      if (!url) {
        console.warn("SKIP live RLS: no DATABASE_URL and embedded Postgres could not start");
        return;
      }
      const admin = postgres(url, { max: 1, onnotice: () => undefined });
      try {
        await admin.unsafe(readFileSync("db/provision-roles.sql", "utf8"));
        await admin.unsafe(readFileSync("db/schema.sql", "utf8"));
        await admin.unsafe(readFileSync("db/schema-learning.sql", "utf8"));
        await admin.unsafe(readFileSync("db/schema-roster.sql", "utf8"));
        const tables = await admin`
          SELECT tablename FROM pg_tables
          WHERE schemaname = 'public' AND tablename = ANY(${REQUIRED_TABLES})
        `;
        expect(tables.length).toBe(REQUIRED_TABLES.length);

        const a = randomUUID();
        const b = randomUUID();
        await admin`INSERT INTO students (id, roll_identifier, password_hash, status)
          VALUES (${a}, '26EG104G01', 'x', 'active'),
                 (${b}, '26EG104G02', 'x', 'active')`;
        const rosterCount = await admin`SELECT count(*)::int AS n FROM student_roster`;
        expect(rosterCount[0]?.n).toBe(51);

        const asStudent = async (id: string, fn: (tx: typeof admin) => Promise<unknown>) => {
          return admin.begin(async (tx) => {
            await tx`SELECT set_config('cforge.student_id', ${id}, true)`;
            await tx.unsafe("SET LOCAL ROLE cforge_app");
            return fn(tx as unknown as typeof admin);
          });
        };

        await asStudent(a, async (tx) => {
          await tx`INSERT INTO learning_events (
            student_id, topic_id, kind, dimension, assisted, curriculum_version, rubric_version
          ) VALUES (${a}, 'u1-t2', 'lesson_opened', 'concept', false, 'v', '2d1-placement-v1')`;
        });

        const seenByA = (await asStudent(a, async (tx) => {
          return tx`SELECT student_id, topic_id FROM learning_events`;
        })) as { student_id: string }[];
        expect(seenByA.every((row) => row.student_id === a)).toBe(true);
        expect(seenByA.length).toBeGreaterThan(0);

        const seenByB = await asStudent(b, async (tx) => {
          return tx`SELECT student_id FROM learning_events`;
        });
        expect(seenByB as unknown[]).toEqual([]);

        await expect(
          asStudent(a, async (tx) => {
            await tx`INSERT INTO learning_events (
              student_id, topic_id, kind, dimension, assisted, curriculum_version, rubric_version
            ) VALUES (${b}, 'u1-t2', 'lesson_opened', 'concept', false, 'v', '2d1-placement-v1')`;
          }),
        ).rejects.toThrow();

        await expect(
          asStudent(a, async (tx) => {
            await tx`DELETE FROM learning_events WHERE student_id = ${b}`;
          }),
        ).rejects.toThrow();

        await expect(
          admin.begin(async (tx) => {
            await tx.unsafe("SET LOCAL ROLE cforge_app");
            await tx`INSERT INTO learning_events (
              student_id, topic_id, kind, dimension, assisted, curriculum_version, rubric_version
            ) VALUES (${a}, 'u1-t2', 'lesson_opened', 'concept', false, 'v', '2d1-placement-v1')`;
          }),
        ).rejects.toThrow();

        const rosterSeenByA = (await asStudent(a, async (tx) => {
          return tx`SELECT roll_number FROM student_roster`;
        })) as { roll_number: string }[];
        expect(rosterSeenByA.map((row) => row.roll_number)).toEqual(["26EG104G01"]);

        const rosterSeenByB = (await asStudent(b, async (tx) => {
          return tx`SELECT roll_number FROM student_roster`;
        })) as { roll_number: string }[];
        expect(rosterSeenByB.map((row) => row.roll_number)).toEqual(["26EG104G02"]);
      } finally {
        await admin.end();
      }
    },
    90_000,
  );
});
