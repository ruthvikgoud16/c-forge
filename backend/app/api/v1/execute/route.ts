import { readSession } from "@/lib/academy/session";
import { getStore } from "@/lib/academy/store";
import { fallbackExercise, fetchExercise } from "@/lib/academy/db";
import { loadEnv } from "@/lib/academy/env";
import { runExercise, submitExercise } from "@/lib/academy/execute";
import { assertNoHiddenLeak } from "@/lib/academy/public-dto";
import { isJudgeUnavailable, json, readJsonBody, rejectCrossOrigin, SOURCE_BODY_LIMIT } from "@/lib/academy/http";
import { limitRequest, rateLimited } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  const origin = rejectCrossOrigin(request);
  if (origin) return origin;
  const session = await readSession();
  if (!session) return json(401, { error: "unauthorized" });
  const parsed = await readJsonBody(request, SOURCE_BODY_LIMIT);
  if (!parsed.ok) return parsed.response;
  const body = parsed.value as {
    exerciseId?: string;
    source?: string;
    mode?: "run" | "submit";
    stdin?: string;
  } | null;
  const limited = await limitRequest(request, body?.mode === "submit" ? "judgeSubmit" : "judgeRun");
  if (!limited.ok) return rateLimited(limited.retryAfterSec);

  if (!body?.exerciseId || !body.source || (body.mode !== "run" && body.mode !== "submit")) {
    return json(400, { error: "invalid_body" });
  }

  const exercise =
    (await fetchExercise(body.exerciseId)) ??
    fallbackExercise(body.exerciseId) ??
    getStore().getExercise(body.exerciseId);
  if (!exercise) return json(404, { error: "not_found" });

  try {
    const env = loadEnv();
    const result =
      body.mode === "run"
        ? await runExercise(env, exercise, body.source, body.stdin, { ownerId: session.studentId })
        : await submitExercise(env, exercise, body.source, { ownerId: session.studentId });
    assertNoHiddenLeak(result);
    return json(200, result);
  } catch (error) {
    if (isJudgeUnavailable(error)) {
      return json(503, { error: "JUDGE_UNAVAILABLE", code: "JUDGE_UNAVAILABLE" });
    }
    throw error;
  }
}
