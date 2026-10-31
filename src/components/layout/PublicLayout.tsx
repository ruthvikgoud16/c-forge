import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Logo } from "@/components/common/bits";
import { Button } from "@/components/ui/button";
import { Aurora } from "@/components/art/motion";

export function PublicLayout({ children }: { children: ReactNode }) {
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
          <Button asChild variant="ink" size="sm" className="press rounded-full"><Link to="/login" data-testid="nav-student-login">Student Login</Link></Button>
        </div>
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
              <li><Link to="/learn/units" className="hover:text-ember">Curriculum</Link></li>
              <li><Link to="/learn/tools" className="hover:text-ember">Visualisers</Link></li>
              <li><Link to="/studio" className="hover:text-ember">Coding studio</Link></li>
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
            <p>Access is by faculty invitation only. This preview uses fictional demonstration data; no real student information is collected or stored.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
