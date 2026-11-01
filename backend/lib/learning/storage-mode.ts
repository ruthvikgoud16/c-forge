import { loadEnv } from "@/lib/academy/env";

export type LearningStorageMode = "memory" | "postgres";

export class LearningPersistError extends Error {
  code = "LEARNING_PERSIST_FAILED";
  httpStatus = 503;
  constructor(message: string) {
    super(message);
  }
}

export function learningStorageMode(raw: NodeJS.ProcessEnv = process.env): LearningStorageMode {
  const env = loadEnv(raw);
  if (env.isProduction) return "postgres";
  if (raw.ALLOW_MEMORY_LEARNING === "1") return "memory";
  if (env.databaseUrl) return "postgres";
  return "memory";
}

export function assertProductionLearningStorage(raw: NodeJS.ProcessEnv = process.env) {
  const env = loadEnv(raw);
  if (!env.isProduction) return;
  if (!env.databaseUrl) {
    throw new LearningPersistError("DATABASE_URL is required in production");
  }
  if (raw.ALLOW_MEMORY_LEARNING === "1") {
    throw new LearningPersistError("ALLOW_MEMORY_LEARNING is forbidden in production");
  }
}

export function requireStudentId(studentId: string | undefined | null) {
  if (!studentId || !/^[0-9a-f-]{36}$/i.test(studentId)) {
    throw new LearningPersistError("missing_student_identity");
  }
  return studentId;
}
