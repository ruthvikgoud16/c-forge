import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogOut, User } from "lucide-react";
import { Logo, DemoBadge } from "@/components/common/bits";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { services } from "@/services";
import { Aurora } from "@/components/art/motion";

export const Route = createFileRoute("/learn")({ component: StudentLayout });

const NAV = [
  { to: "/learn", label: "Dashboard", exact: true },
  { to: "/learn/units", label: "Units" },
  { to: "/learn/path", label: "Path" },
  { to: "/learn/tools", label: "Visualisers" },
  { to: "/learn/practice", label: "Practice" },
  { to: "/learn/assessments", label: "Assessments" },
  { to: "/learn/revision", label: "Revision" },
  { to: "/learn/progress", label: "Progress" },
  { to: "/studio", label: "Studio" },
] as const;

function StudentLayout() {
  const nav = useNavigate();
  const [name, setName] = useState("Aarav Rao");
  const [roll, setRoll] = useState("DEMO-001");
  useEffect(() => {
    const s = services.auth.currentSession();
    if (s?.role === "student") { setName(s.displayName); setRoll(s.rollNumber ?? ""); }
  }, []);
  return (
    <div className="theme-student min-h-screen relative isolate overflow-x-clip">
      <Aurora />
      <header className="surface-ink sticky top-0 z-30">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 md:px-6">
          <Link to="/learn" aria-label="CForge dashboard"><Logo className="text-lg" /></Link>
          <DemoBadge>Demo</DemoBadge>
          <div className="flex-1" />
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-full border border-border px-2 py-1 text-sm hover:bg-secondary" aria-label="Student menu">
              <span className="grid size-7 place-items-center rounded-full bg-ember font-mono text-xs text-ink">{name.split(" ").map((p) => p[0]).join("")}</span>
              <span className="hidden sm:inline">{name}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel><div>{name}</div><div className="font-mono text-xs text-muted-foreground">{roll}</div></DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => nav({ to: "/learn/progress" })}><User /> My progress</DropdownMenuItem>
              <DropdownMenuItem onSelect={async () => { await services.auth.signOut(); nav({ to: "/" }); }}><LogOut /> Sign out</DropdownMenuItem>
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
