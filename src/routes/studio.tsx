import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Logo, DemoBadge } from "@/components/common/bits";

export const Route = createFileRoute("/studio")({ component: StudioLayout });

function StudioLayout() {
  return (
    <div className="theme-coding min-h-screen">
      <header className="flex h-12 items-center gap-4 border-b border-border px-4">
        <Link to="/learn" aria-label="Back to academy"><Logo mono className="text-base" /></Link>
        <span className="text-sm text-muted-foreground">Coding Studio</span>
        <DemoBadge>Simulated judge</DemoBadge>
        <div className="flex-1" />
        <Link to="/studio" className="text-sm text-muted-foreground hover:text-foreground">Exercises</Link>
        <Link to="/learn" className="text-sm text-muted-foreground hover:text-foreground">Academy</Link>
      </header>
      <Outlet />
    </div>
  );
}
