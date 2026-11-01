export type AcademyEnv = {
  nodeEnv: string;
  isProduction: boolean;
  databaseUrl: string | undefined;
  databaseAppUrl: string | undefined;
  sessionSecret: string;
  judgeUrl: string | undefined;
  judgeSecret: string | undefined;
  facultyToken: string | undefined;
  facultyDatabaseUrl: string | undefined;
  allowDevInvite: boolean;
  devInviteToken: string | undefined;
  judgeAllowProduction: boolean;
  judgeBackend: "docker" | "firecracker" | "mock";
};

function urlUser(url: string) {
  try {
    return decodeURIComponent(new URL(url).username || "");
  } catch {
    return "";
  }
}

const INSECURE = new Set([
  "",
  "replace-with-64-char-random",
  "replace-with-shared-judge-secret",
  "replace-with-faculty-token",
  "dev-judge-secret-not-for-production",
  "changeme",
  "secret",
]);

export function loadEnv(raw: NodeJS.ProcessEnv = process.env): AcademyEnv {
  const nodeEnv = raw.NODE_ENV ?? "development";
  const isProduction = nodeEnv === "production";
  const sessionSecret = raw.SESSION_SECRET ?? "";
  const judgeUrl = raw.JUDGE_URL?.trim() || undefined;
  const judgeSecret = raw.JUDGE_SECRET?.trim() || undefined;
  const facultyToken = raw.FACULTY_TOKEN?.trim() || undefined;
  const facultyDatabaseUrl = raw.FACULTY_DATABASE_URL?.trim() || undefined;
  const judgeAllowProduction = raw.JUDGE_ALLOW_PRODUCTION === "1";
  const backendRaw = raw.JUDGE_BACKEND?.trim();
  const judgeBackend =
    backendRaw === "firecracker" || backendRaw === "mock" ? backendRaw : "docker";

  if (isProduction) {
    if (!sessionSecret || sessionSecret.length < 32 || INSECURE.has(sessionSecret)) {
      throw new Error("SESSION_SECRET is required and must be strong in production");
    }
    if (!raw.DATABASE_URL) {
      throw new Error("DATABASE_URL is required in production");
    }
    if (raw.ALLOW_MEMORY_LEARNING === "1") {
      throw new Error("ALLOW_MEMORY_LEARNING is forbidden in production");
    }
    if (judgeUrl?.includes("localhost") || judgeUrl?.includes("127.0.0.1")) {
      // Allowed only if explicitly set; still not a default. No throw.
    }
    if (INSECURE.has(judgeSecret ?? "") && judgeSecret) {
      throw new Error("JUDGE_SECRET is insecure for production");
    }
    if (!facultyToken || INSECURE.has(facultyToken)) {
      throw new Error("FACULTY_TOKEN is required and must be strong in production");
    }
    if (!facultyDatabaseUrl) {
      throw new Error("FACULTY_DATABASE_URL is required in production");
    }
    if (facultyDatabaseUrl === raw.DATABASE_URL) {
      throw new Error("FACULTY_DATABASE_URL must not reuse DATABASE_URL");
    }
    const dbUser = urlUser(raw.DATABASE_URL);
    if (["cforge", "cforge_owner", "cforge_migrator", "postgres"].includes(dbUser)) {
      throw new Error("DATABASE_URL must use the cforge_app runtime login");
    }
    if (!raw.CFORGE_PUBLIC_ORIGIN?.trim()) {
      throw new Error("CFORGE_PUBLIC_ORIGIN is required in production");
    }
  }

  return {
    nodeEnv,
    isProduction,
    databaseUrl: raw.DATABASE_URL,
    databaseAppUrl: raw.DATABASE_APP_URL || raw.DATABASE_URL,
    sessionSecret: sessionSecret || "dev-only-session-secret-not-for-production-use",
    judgeUrl,
    judgeSecret,
    facultyToken,
    facultyDatabaseUrl,
    allowDevInvite: raw.ALLOW_DEV_INVITE === "1" && !isProduction,
    devInviteToken: raw.DEV_INVITE_TOKEN,
    judgeAllowProduction,
    judgeBackend,
  };
}

export function assertJudgeConfigured(env: AcademyEnv): asserts env is AcademyEnv & {
  judgeUrl: string;
  judgeSecret: string;
} {
  if (!env.judgeUrl || !env.judgeSecret) {
    const error = new Error("JUDGE_UNAVAILABLE");
    (error as Error & { code: string; httpStatus: number }).code = "JUDGE_UNAVAILABLE";
    (error as Error & { code: string; httpStatus: number }).httpStatus = 503;
    throw error;
  }
  if (env.isProduction && !env.judgeAllowProduction) {
    const error = new Error("JUDGE_DISABLED_UNVERIFIED_ISOLATION");
    (error as Error & { code: string; httpStatus: number }).code = "JUDGE_DISABLED_UNVERIFIED_ISOLATION";
    (error as Error & { code: string; httpStatus: number }).httpStatus = 503;
    throw error;
  }
}
