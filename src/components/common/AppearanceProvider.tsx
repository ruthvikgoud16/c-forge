import { useRouterState } from "@tanstack/react-router";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { applyAppearance, readStoredAppearance, type Appearance } from "@/lib/appearance";
import { IS_DEMO, services } from "@/services";

const AppearanceContext = createContext<{
  appearance: Appearance;
  setAppearance: (next: Appearance) => Promise<void>;
}>({
  appearance: "light",
  setAppearance: async () => undefined,
});

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [appearance, setState] = useState<Appearance>(() => readStoredAppearance());
  const path = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    applyAppearance(appearance);
  }, [appearance]);

  useEffect(() => {
    if (!path.startsWith("/learn") && !path.startsWith("/studio")) return;
    const session = services.auth.currentSession();
    if (session?.role !== "student" || IS_DEMO) return;
    services.student.me().then((profile) => {
      if (profile.appearance === "dark" || profile.appearance === "light") {
        setState(profile.appearance);
        applyAppearance(profile.appearance);
      }
    }).catch(() => undefined);
  }, [path]);

  const value = useMemo(() => ({
    appearance,
    async setAppearance(next: Appearance) {
      setState(next);
      applyAppearance(next);
      const session = services.auth.currentSession();
      if (session?.role === "student") {
        await services.student.updateProfile({ appearance: next }).catch(() => undefined);
      }
    },
  }), [appearance]);

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance() {
  return useContext(AppearanceContext);
}
