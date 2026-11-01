import postgres from "postgres";
import { loadEnv } from "./env";
import { findJudgeExercise } from "./exercise-bank";
import type { ExerciseRow } from "./public-dto";
import { LearningPersistError, requireStudentId } from "@/lib/learning/storage-mode";

let sql: ReturnType<typeof postgres> | null = null;
let facultySql: ReturnType<typeof postgres> | null = null;

export class FacultyPersistError extends Error {
  code = "FACULTY_PERSIST_FAILED";
  httpStatus = 503;
  constructor(message = "FACULTY_DATABASE_URL is not configured") {
    super(message);
  }
}

export function getSql() {
  const env = loadEnv();
  if (!env.databaseUrl) return null;
  if (!sql) sql = postgres(env.databaseUrl, { max: 4 });
  return sql;
}

export function getFacultySql() {
  const env = loadEnv();
  if (!env.facultyDatabaseUrl) return null;
  if (env.databaseUrl && env.facultyDatabaseUrl === env.databaseUrl) return null;
  if (!facultySql) facultySql = postgres(env.facultyDatabaseUrl, { max: 2 });
  return facultySql;
}

export function facultyDbReady() {
  if (!loadEnv().databaseUrl) return "memory" as const;
  return getFacultySql() ? ("postgres" as const) : ("unavailable" as const);
}

export function requireFacultyDbIfAppDb() {
  if (facultyDbReady() === "unavailable") {
    throw new FacultyPersistError();
  }
}

export async function closeSql() {
  const current = sql;
  const faculty = facultySql;
  sql = null;
  facultySql = null;
  if (current) await current.end({ timeout: 5 });
  if (faculty) await faculty.end({ timeout: 5 });
}

export type Sql = NonNullable<ReturnType<typeof getSql>>;

/** Application persist role. Used for DEFINER accessors; not table-owner DML. */
export async function withAppTx<T>(fn: (tx: Sql) => Promise<T>): Promise<T> {
  const client = getSql();
  if (!client) {
    throw new LearningPersistError("DATABASE_URL is not configured");
  }
  return client.begin(async (tx) => {
    await tx.unsafe("SET LOCAL ROLE cforge_app");
    return fn(tx as unknown as Sql);
  });
}

/** Transaction-local tenant identity for pooled connections. Missing id fails closed. */
export async function withStudentTx<T>(studentId: string, fn: (tx: Sql) => Promise<T>): Promise<T> {
  const id = requireStudentId(studentId);
  const client = getSql();
  if (!client) {
    throw new LearningPersistError("DATABASE_URL is not configured");
  }
  return client.begin(async (tx) => {
    await tx`SELECT set_config('cforge.student_id', ${id}, true)`;
    await tx.unsafe("SET LOCAL ROLE cforge_app");
    return fn(tx as unknown as Sql);
  });
}

/**
 * Faculty Bearer is checked by the caller. Uses the faculty login only.
 * The ordinary DATABASE_URL pool is never used here.
 */
export async function withFacultyTx<T>(fn: (tx: Sql) => Promise<T>): Promise<T> {
  requireFacultyDbIfAppDb();
  const client = getFacultySql();
  if (!client) {
    throw new FacultyPersistError();
  }
  return client.begin(async (tx) => {
    const who = await tx`SELECT current_user AS usr`;
    if (who[0]?.usr !== "cforge_faculty") {
      throw new FacultyPersistError("faculty connection is not the cforge_faculty role");
    }
    return fn(tx as unknown as Sql);
  });
}

export async function fetchExercise(id: string): Promise<ExerciseRow | undefined> {
  const client = getSql();
  if (!client) return undefined;
  return withAppTx(async (tx) => {
    const rows = await tx`
      SELECT id, slug, title, objective, statement,
             input_format, output_format, constraints_text, starter_code, language
      FROM exercises WHERE id = ${id} OR slug = ${id}
    `;
    if (!rows[0]) return undefined;
    const tests = await tx`SELECT * FROM academy_exercise_tests(${rows[0].id})`;
    return {
      id: rows[0].id,
      slug: rows[0].slug,
      title: rows[0].title,
      objective: rows[0].objective,
      statement: rows[0].statement,
      inputFormat: rows[0].input_format,
      outputFormat: rows[0].output_format,
      constraints: rows[0].constraints_text,
      starterCode: rows[0].starter_code,
      language: rows[0].language,
      tests: tests.map((t) => ({
        ordinal: Number(t.ordinal),
        visibility: t.visibility as "sample" | "hidden",
        stdin: t.stdin,
        expectedStdout: t.expected_stdout,
      })),
    };
  });
}

export function fallbackExercise(id: string) {
  return findJudgeExercise(id);
}
