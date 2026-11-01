import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/public/logo";
import "@/app/styles/emergent.css";

export function PublicFrame({ children }: { children: ReactNode }) {
  return (
    <div className="em">
      <header className="em-header">
        <div className="em-header-row">
          <Link href="/" aria-label="CForge home">
            <Logo />
          </Link>
          <nav className="em-nav" aria-label="Main">
            <a href="/#approach">Approach</a>
            <a href="/#curriculum">Curriculum</a>
            <a href="/#visualise">Visualisers</a>
            <Link href="/faculty">Faculty</Link>
          </nav>
          <Link className="em-btn em-btn-ink em-btn-sm" href="/login">
            Student Login
          </Link>
        </div>
      </header>
      <main>{children}</main>
      <footer className="em-ink">
        <div className="em-footer">
          <div>
            <Logo />
            <p className="em-muted">Forge your logic. Master your C.</p>
          </div>
          <div>
            <p className="em-eyebrow">Learn</p>
            <p>
              <Link href="/learn">Academy dashboard</Link>
            </p>
            <p>
              <Link href="/learn/tools/binary">Visualisers</Link>
            </p>
          </div>
          <div>
            <p className="em-eyebrow">Access</p>
            <p>
              <Link href="/login">Student login</Link>
            </p>
            <p>
              <Link href="/join">Join with invitation</Link>
            </p>
            <p>
              <Link href="/faculty">Faculty access</Link>
            </p>
          </div>
          <p className="em-muted">
            Invitation-only. Access is by faculty invitation. Your roll number is your login.
          </p>
        </div>
      </footer>
    </div>
  );
}
