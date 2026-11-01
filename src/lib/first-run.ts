import { firstRunPath } from "@/lib/diagnostic";
import type { CForgeServices } from "@/services/contracts";

export async function studentHomePath(services: CForgeServices) {
  const [{ startIntent }, sessions] = await Promise.all([
    services.onboarding.get(),
    services.diagnostics.list().catch(() => []),
  ]);
  return firstRunPath({ startIntent, sessions });
}
