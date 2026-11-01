import { redirect } from "next/navigation";
import { readSession } from "@/lib/academy/session";
import { getStore } from "@/lib/academy/store";
import { fallbackExercise, fetchExercise } from "@/lib/academy/db";
import { toPublicExercise } from "@/lib/academy/public-dto";
import { Workspace } from "@/components/workspace";

export default async function StudioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await readSession();
  if (!session) redirect("/login");
  const { id } = await params;
  const exercise =
    (await fetchExercise(id)) ?? fallbackExercise(id) ?? getStore().getExercise(id);
  if (!exercise) redirect("/");
  return (
    <main className="shell">
      <p className="brand">CForge studio · {session.rollIdentifier}</p>
      <Workspace exercise={toPublicExercise(exercise)} />
    </main>
  );
}
