import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { Logo, DemoBadge } from "@/components/common/bits";
import { IS_DEMO, services } from "@/services";

export const Route = createFileRoute("/studio")({
  loader: async () => {
    if (services.auth.currentSession()?.role === "faculty") throw redirect({ to: "/faculty" });
    if (IS_DEMO) {
      const session = services.auth.currentSession();
      if (!session || session.role !== "student") throw redirect({ to: "/login" });
      return null;
    }
    await services.student.me();
    return null;
  },
  errorComponent: StudioLoadError,
  component: StudioLayout,
});

function StudioLoadError() {
  return (
    <div className="theme-coding min-h-screen px-4 py-16">
      <div className="mx-auto max-w-xl glass-panel rounded-[2rem] p-8">
        <p className="eyebrow">Coding studio</p>
        <h1 className="mt-2 font-display text-3xl">Studio could not load</h1>
        <p className="mt-3 text-sm text-muted-foreground">The studio is a signed-in student area. The judge is never simulated.</p>
        <div className="mt-6 flex flex-wrap gap-4 text-sm">
          <Link to="/login" className="text-copper hover:underline">Student login</Link>
          <Link to="/learn" className="text-copper hover:underline">Academy</Link>
        </div>
      </div>
    </div>
  );
}

function StudioLayout() {
  return (
    <div className="theme-coding min-h-screen">
      <header className="flex h-12 items-center gap-4 border-b border-white/10 bg-black/20 px-4 backdrop-blur-xl">
        <Link to="/learn" aria-label="Back to academy"><Logo mono className="text-base" /></Link>
        <span className="text-sm text-muted-foreground">Coding Studio</span>
        {IS_DEMO && <DemoBadge>Judge unavailable in demo</DemoBadge>}
        <div className="flex-1" />
        <Link to="/studio" className="text-sm text-muted-foreground hover:text-foreground">Exercises</Link>
        <Link to="/learn" className="text-sm text-muted-foreground hover:text-foreground">Academy</Link>
      </header>
      <Outlet />
    </div>
  );
}
