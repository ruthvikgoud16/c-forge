import { allJudgeExercises } from "@/lib/academy/exercise-bank";
import { json } from "@/lib/academy/http";
import { assertNoHiddenLeak, toPublicExercise } from "@/lib/academy/public-dto";
import { topicIdForExercise } from "@/lib/academy/exercise-bank";
import { readSession } from "@/lib/academy/session";

export async function GET() {
  const session = await readSession();
  if (!session) return json(401, { error: "unauthorized" });
  const exercises = allJudgeExercises().map((row) => {
    const pub = toPublicExercise(row);
    return { ...pub, topicId: topicIdForExercise(row.id) ?? null, hiddenTestCount: row.tests.filter((test) => test.visibility === "hidden").length };
  });
  assertNoHiddenLeak(exercises);
  return json(200, { exercises });
}
