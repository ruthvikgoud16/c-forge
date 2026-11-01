import { json } from "@/lib/academy/http";
import { loadEnv } from "@/lib/academy/env";
import { getSql } from "@/lib/academy/db";
import { assertLearningSchema } from "@/lib/learning/persist";
import { assertProductionLearningStorage, learningStorageMode } from "@/lib/learning/storage-mode";

export async function GET() {
  const env = loadEnv();
  const mode = learningStorageMode();
  if (env.isProduction) {
    try {
      assertProductionLearningStorage();
      const sql = getSql();
      if (!sql) return json(503, { ok: false, error: "not_ready" });
      await sql`SELECT 1 AS ok`;
      await assertLearningSchema();
    } catch {
      return json(503, { ok: false, error: "not_ready" });
    }
    return json(200, { ok: true, storage: "postgres" });
  }
  let database: string | undefined;
  if (mode === "postgres") {
    const sql = getSql();
    if (sql) {
      const row = await sql`SELECT current_database() AS db`;
      database = String(row[0]?.db ?? "");
    }
  }
  return json(200, { ok: true, storage: mode, production: false, database });
}
