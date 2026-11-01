import { afterAll, describe, expect, it } from "vitest";
import { readFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import postgres from "postgres";
import EmbeddedPostgres from "embedded-postgres";

let liveUrl = process.env.DATABASE_URL ?? "";
let embedded: EmbeddedPostgres | null = null;
let embeddedReady: boolean | null = null;

async function ensureEmbedded() {
  if (liveUrl) return liveUrl;
  if (embeddedReady === false) return "";
  if (embedded) return liveUrl;
  try {
    const dir = mkdtempSync(join(tmpdir(), "cforge-assess-pg-"));
    embedded = new EmbeddedPostgres({
      databaseDir: dir,
      user: "postgres",
      password: "cforge",
      port: 55434,
      persistent: false,
      autoRehydrateSymlinks: true,
    });
    await embedded.initialise();
    await embedded.start();
    liveUrl = "postgres://postgres:cforge@127.0.0.1:55434/postgres";
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

describe("practice assessment PostgreSQL", () => {
  it("ships FORCE RLS and no DELETE grant for cforge_app", () => {
    const sql = readFileSync("db/schema-assessments.sql", "utf8");
    expect(sql).toContain("FORCE ROW LEVEL SECURITY");
    expect(sql).toContain("practice_assessment_attempts");
    expect(sql).toContain("idempotency_key");
    expect(sql).not.toMatch(/GRANT DELETE/);
  });

  it(
    "isolates two students' attempts as cforge_app",
    async () => {
      const url = await ensureEmbedded();
      if (!url) {
        console.warn("SKIP live assessment RLS: no DATABASE_URL and embedded Postgres could not start");
        return;
      }
      const admin = postgres(url, { max: 1, onnotice: () => undefined });
      try {
        await admin.unsafe(readFileSync("db/provision-roles.sql", "utf8"));
        await admin.unsafe(readFileSync("db/schema.sql", "utf8"));
        await admin.unsafe(readFileSync("db/schema-learning.sql", "utf8"));
        await admin.unsafe(readFileSync("db/schema-assessments.sql", "utf8"));
        const a = randomUUID();
        const b = randomUUID();
        await admin`INSERT INTO students (id, roll_identifier, password_hash, status)
          VALUES (${a}, '26EG104G11', 'x', 'active'),
                 (${b}, '26EG104G12', 'x', 'active')`;

        const asStudent = async (id: string, fn: (tx: typeof admin) => Promise<unknown>) => {
          return admin.begin(async (tx) => {
            await tx`SELECT set_config('cforge.student_id', ${id}, true)`;
            await tx.unsafe("SET LOCAL ROLE cforge_app");
            return fn(tx as unknown as typeof admin);
          });
        };

        await asStudent(a, async (tx) => {
          await tx`INSERT INTO practice_assessment_attempts (
            student_id, assessment_id, attempt_no, earned, total, by_topic, responses, item_results, started_at
          ) VALUES (
            ${a}, 'topic:u1-t1', 1, 2, 8, '{}'::jsonb, '{"q1":"alu"}'::jsonb, '[]'::jsonb, now()
          )`;
        });

        const seenByA = (await asStudent(a, async (tx) => {
          return tx`SELECT student_id, assessment_id, earned FROM practice_assessment_attempts`;
        })) as { student_id: string }[];
        expect(seenByA.every((row) => row.student_id === a)).toBe(true);
        expect(seenByA.length).toBe(1);

        const seenByB = await asStudent(b, async (tx) => {
          return tx`SELECT student_id FROM practice_assessment_attempts`;
        });
        expect(seenByB as unknown[]).toEqual([]);

        await expect(
          asStudent(a, async (tx) => {
            await tx`INSERT INTO practice_assessment_attempts (
              student_id, assessment_id, attempt_no, earned, total, started_at
            ) VALUES (${b}, 'topic:u1-t1', 1, 8, 8, now())`;
          }),
        ).rejects.toThrow();

        const updated = (await asStudent(a, async (tx) => {
          return tx`UPDATE practice_assessment_attempts SET earned = 99 WHERE student_id = ${b} RETURNING id`;
        })) as unknown[];
        expect(updated).toEqual([]);

        await expect(
          asStudent(a, async (tx) => {
            await tx`DELETE FROM practice_assessment_attempts`;
          }),
        ).rejects.toThrow();

        await expect(
          admin.begin(async (tx) => {
            await tx.unsafe("SET LOCAL ROLE cforge_app");
            await tx`INSERT INTO practice_assessment_attempts (
              student_id, assessment_id, attempt_no, earned, total, started_at
            ) VALUES (${a}, 'topic:u1-t1', 2, 1, 8, now())`;
          }),
        ).rejects.toThrow();
      } finally {
        await admin.end();
      }
    },
    90_000,
  );
});
