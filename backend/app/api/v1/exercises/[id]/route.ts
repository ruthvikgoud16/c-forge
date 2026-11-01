import { readSession } from "@/lib/academy/session";
import { getStore } from "@/lib/academy/store";
import { fallbackExercise, fetchExercise } from "@/lib/academy/db";
import { toPublicExercise, assertNoHiddenLeak } from "@/lib/academy/public-dto";
import { json } from "@/lib/academy/http";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await readSession();
  if (!session) return json(401, { error: "unauthorized" });
  const { id } = await context.params;
  const exercise = (await fetchExercise(id)) ?? fallbackExercise(id) ?? getStore().getExercise(id);
  if (!exercise) return json(404, { error: "not_found" });
  const dto = toPublicExercise(exercise);
  assertNoHiddenLeak(dto);
  return json(200, dto);
}
