import { GateForm } from "@/components/gate-form";

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <main className="shell">
      <p className="brand">CForge</p>
      <h1>Join with an invitation</h1>
      <p className="meta">There is no public registration. Seats are capped at 51 active students.</p>
      <GateForm mode="join" initialToken={token ?? ""} />
    </main>
  );
}
