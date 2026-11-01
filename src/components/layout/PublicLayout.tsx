import { Link } from "@tanstack/react-router";
import { useState } from "react";
import type { ReactNode } from "react";
import { Logo, DemoBadge } from "@/components/common/bits";
import { Button } from "@/components/ui/button";
import { Aurora } from "@/components/art/motion";
import { IS_DEMO } from "@/services";

export function PublicLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="theme-public relative isolate flex min-h-screen flex-col overflow-x-clip">
      <Aurora />
      <header className="sticky top-0 z-30 border-b border-white/60 bg-white/45 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
          <Link to="/" aria-label="CForge home"><Logo /></Link>
          <nav aria-label="Main" className="hidden items-center gap-6 text-sm md:flex">
            <a href="/#approach" className="hover:text-copper">Approach</a>
            <a href="/#curriculum" className="hover:text-copper">Curriculum</a>
            <a href="/#visualise" className="hover:text-copper">Visualisers</a>
            <Link to="/faculty-login" className="hover:text-copper">Faculty</Link>
          </nav>
          <div className="flex items-center gap-2">
            {IS_DEMO && <DemoBadge>Demo site</DemoBadge>}
            <Button asChild variant="ink" size="sm" className="press rounded-full"><Link to="/login" data-testid="nav-student-login">Student Login</Link></Button>
            <button type="button" className="grid size-10 place-items-center rounded-full glass-panel md:hidden" aria-expanded={open} aria-controls="public-menu" onClick={() => setOpen((value) => !value)}>
              <span className="sr-only">Menu</span>
              <span aria-hidden className="block h-0.5 w-4 bg-foreground" />
            </button>
          </div>
        </div>
        {open ? (
          <nav id="public-menu" aria-label="Mobile" className="border-t border-white/50 px-4 py-3 md:hidden">
            <ul className="space-y-2 text-sm">
              <li><a href="/#approach" className="block rounded-full px-3 py-2 hover:bg-white/50" onClick={() => setOpen(false)}>Approach</a></li>
              <li><a href="/#curriculum" className="block rounded-full px-3 py-2 hover:bg-white/50" onClick={() => setOpen(false)}>Curriculum</a></li>
              <li><a href="/#visualise" className="block rounded-full px-3 py-2 hover:bg-white/50" onClick={() => setOpen(false)}>Visualisers</a></li>
              <li><Link to="/faculty-login" className="block rounded-full px-3 py-2 hover:bg-white/50" onClick={() => setOpen(false)}>Faculty</Link></li>
              <li><Link to="/login" className="block rounded-full px-3 py-2 hover:bg-white/50" onClick={() => setOpen(false)}>Student login</Link></li>
            </ul>
          </nav>
        ) : null}
      </header>
      <main className="flex-1">{children}</main>
      <footer className="surface-ink">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4 md:px-6">
          <div>
            <Logo />
            <p className="mt-3 text-sm text-muted-foreground">Forge your logic. Master your C.</p>
          </div>
          <div className="text-sm">
            <p className="eyebrow mb-3">Learn</p>
            <ul className="space-y-2">
              <li><a href="/#curriculum" className="hover:text-ember">Curriculum</a></li>
              <li><a href="/#visualise" className="hover:text-ember">Visualisers</a></li>
              <li><Link to="/login" className="hover:text-ember">Student academy</Link></li>
            </ul>
          </div>
          <div className="text-sm">
            <p className="eyebrow mb-3">Access</p>
            <ul className="space-y-2">
              <li><Link to="/login" className="hover:text-ember">Student login</Link></li>
              <li><Link to="/faculty-login" className="hover:text-ember">Faculty access</Link></li>
            </ul>
          </div>
          <div className="text-sm text-muted-foreground">
            <p className="eyebrow mb-3">Academic & privacy</p>
            <p>{IS_DEMO ? "Access is by faculty invitation only. This preview uses fictional demonstration data; no real student information is collected or stored." : "Access is by faculty invitation only. The catalog is the official syllabus. Student records stay on the server."}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
