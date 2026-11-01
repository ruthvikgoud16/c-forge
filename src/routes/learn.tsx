import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { LogOut, Settings, User } from "lucide-react";
import { Logo, DemoBadge } from "@/components/common/bits";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { IS_DEMO, services } from "@/services";
import { logoutDest } from "@/lib/session-dest";
import { Aurora } from "@/components/art/motion";

export const Route = createFileRoute("/learn")({
  loader: async () => {
    if (services.auth.currentSession()?.role === "faculty") throw redirect({ to: "/faculty" });
    if (IS_DEMO) {
      const session = services.auth.currentSession();
      if (!session || session.role !== "student") throw redirect({ to: "/login" });
      return { name: session.displayName, roll: session.rollNumber ?? "" };
    }
    const me = await services.student.me();
    return { name: me.name || me.rollNumber, roll: me.rollNumber };
  },
  errorComponent: LearnLoadError,
  component: StudentLayout,
});

function LearnLoadError() {
  return (
    <div className="theme-student min-h-screen px-4 py-16">
      <div className="mx-auto max-w-xl glass-panel rounded-[2rem] p-8">
        <p className="eyebrow">Student area</p>
        <h1 className="mt-2 font-display text-3xl">This view could not load</h1>
        <p className="mt-3 text-sm text-muted-foreground">The original API did not return this student page. No dashboard, progress, or placement was invented.</p>
        <div className="mt-6 flex flex-wrap gap-4 text-sm">
          <Link to="/login" className="text-copper hover:underline">Sign in again</Link>
          <Link to="/" className="text-copper hover:underline">Public site</Link>
        </div>
      </div>
    </div>
  );
}

const NAV = [
  { to: "/learn", label: "Dashboard", exact: true },
  { to: "/learn/onboarding", label: "Start" },
  { to: "/learn/diagnostic", label: "Diagnostic" },
  { to: "/learn/units", label: "Units" },
  { to: "/learn/foundation", label: "Foundation" },
  { to: "/learn/labs", label: "Labs" },
  { to: "/learn/papers", label: "Papers" },
  { to: "/learn/path", label: "Path" },
  { to: "/learn/tools", label: "Visualisers" },
  { to: "/learn/practice", label: "Practice" },
  { to: "/learn/assessments", label: "Assessments" },
  { to: "/learn/revision", label: "Revision" },
  { to: "/learn/progress", label: "Progress" },
  { to: "/learn/profile", label: "Profile" },
  { to: "/learn/settings", label: "Settings" },
  { to: "/studio", label: "Studio" },
] as const;

function StudentLayout() {
  const nav = useNavigate();
  const { name, roll } = Route.useLoaderData();
  return (
    <div className="theme-student min-h-screen relative isolate overflow-x-clip">
      <Aurora />
      <header className="surface-ink sticky top-0 z-30">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 md:px-6">
          <Link to="/learn" aria-label="CForge dashboard"><Logo className="text-lg" /></Link>
          {IS_DEMO && <DemoBadge>Demo</DemoBadge>}
          <div className="flex-1" />
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-full border border-border px-2 py-1 text-sm hover:bg-secondary" aria-label="Student menu">
              <span className="grid size-7 place-items-center rounded-full bg-ember font-mono text-xs text-ink">{name.split(" ").map((p) => p[0]).join("")}</span>
              <span className="hidden sm:inline">{name}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel><div>{name}</div><div className="font-mono text-xs text-muted-foreground">{roll}</div></DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => nav({ to: "/learn/profile" })}><User /> Profile</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => nav({ to: "/learn/settings" })}><Settings /> Settings</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => nav({ to: "/learn/progress" })}><User /> My progress</DropdownMenuItem>
              <DropdownMenuItem onSelect={async () => { await services.auth.signOut(); nav({ to: logoutDest("student") }); }}><LogOut /> Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <nav aria-label="Student" className="mx-auto max-w-7xl overflow-x-auto px-2 md:px-4">
          <ul className="flex gap-1 whitespace-nowrap pb-2 text-sm">
            {NAV.map((n) => (
              <li key={n.to}>
                <Link to={n.to} activeOptions={{ exact: "exact" in n }} className="block rounded-md px-3 py-1.5 text-muted-foreground hover:text-foreground" activeProps={{ className: "bg-white !text-[oklch(0.25_0.02_260)] shadow", "aria-current": "page" }}>
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12"><Outlet /></main>
    </div>
  );
}
