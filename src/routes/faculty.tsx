import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogOut, LayoutDashboard, Users, MailPlus, FlaskConical, FileText, Settings } from "lucide-react";
import { Logo, DemoBadge } from "@/components/common/bits";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { IS_DEMO, services } from "@/services";
import { logoutDest } from "@/lib/session-dest";
import { Aurora } from "@/components/art/motion";

export const Route = createFileRoute("/faculty")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Faculty Portal — CForge" },
      { name: "description", content: "Cohort roster, invitations, student detail and learning summaries." },
      { property: "og:title", content: "Faculty Portal — CForge" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FacultyLayout,
});

const NAV = [
  { to: "/faculty", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/faculty/roster", label: "Roster", icon: Users },
  { to: "/faculty/invitations", label: "Invitations", icon: MailPlus },
  { to: "/faculty/labs", label: "Labs", icon: FlaskConical },
  { to: "/faculty/papers", label: "Papers", icon: FileText },
  { to: "/faculty/settings", label: "Settings", icon: Settings },
] as const;

function FacultyLayout() {
  const nav = useNavigate();
  const [name, setName] = useState(IS_DEMO ? "Demo Faculty" : "Faculty");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const s = services.auth.currentSession();
    if (s?.role === "faculty") {
      setName(s.displayName);
      setReady(true);
    } else if (s?.role === "student") {
      nav({ to: "/learn" });
    } else nav({ to: "/faculty-login" });
  }, [nav]);
  if (!ready) {
    return (
      <div className="theme-faculty relative isolate flex min-h-screen items-center justify-center px-4">
        <Aurora />
        <div className="glass-dark w-full max-w-md rounded-[2rem] p-8 text-center">
          <p className="eyebrow !text-ember">Faculty portal</p>
          <h1 className="mt-2 font-display text-3xl">Checking faculty session</h1>
          <p className="mt-3 text-sm text-white/70">The portal only opens after a faculty token is accepted. No roster or overview is shown while that check runs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="theme-faculty min-h-screen relative isolate overflow-x-clip">
      <Aurora />
      <header className="surface-ink sticky top-0 z-30">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 md:px-6">
          <Link to="/faculty" aria-label="Faculty portal"><Logo className="text-lg" /></Link>
          <span className="hidden rounded bg-ember/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-ember md:inline" data-testid="faculty-badge">Faculty portal</span>
          {IS_DEMO && <DemoBadge>Demo</DemoBadge>}
          <div className="flex-1" />
          <DropdownMenu>
            <DropdownMenuTrigger
              data-testid="faculty-user-menu"
              className="flex items-center gap-2 rounded-full border border-border px-2 py-1 text-sm hover:bg-secondary"
              aria-label="Faculty menu"
            >
              <span className="grid size-7 place-items-center rounded-full bg-copper font-mono text-xs text-pearl">
                {name.split(" ").map((p) => p[0]).join("")}
              </span>
              <span className="hidden sm:inline">{name}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div>{name}</div>
                <div className="font-mono text-xs text-muted-foreground">{IS_DEMO ? "FAC-DEMO" : "Faculty session"}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                data-testid="faculty-signout"
                onSelect={async () => {
                  await services.auth.signOut();
                  nav({ to: logoutDest("faculty") });
                }}
              >
                <LogOut /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <nav aria-label="Faculty" className="mx-auto max-w-7xl overflow-x-auto px-2 md:px-4">
          <ul className="flex gap-1 whitespace-nowrap pb-2 text-sm">
            {NAV.map((n) => {
              const Icon = n.icon;
              return (
                <li key={n.to}>
                  <Link
                    to={n.to}
                    activeOptions={{ exact: "exact" in n }}
                    className="flex items-center gap-2 rounded-md px-3 py-1.5 text-muted-foreground hover:text-foreground"
                    activeProps={{ className: "bg-white !text-[oklch(0.25_0.02_260)] shadow", "aria-current": "page" }}
                    data-testid={`faculty-nav-${n.label.toLowerCase()}`}
                  >
                    <Icon className="size-3.5" /> {n.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12"><Outlet /></main>
    </div>
  );
}
