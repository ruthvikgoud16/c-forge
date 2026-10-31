import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MasteryState } from "@/domain/types";

export function Logo({ className, mono }: { className?: string; mono?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-display text-xl font-semibold", className)}>
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden>
        <rect x="2" y="2" width="28" height="28" rx="6" className={mono ? "fill-current opacity-15" : "fill-ink"} />
        <path d="M20.5 10.5a7 7 0 1 0 0 11" fill="none" strokeWidth="3" strokeLinecap="round" className="stroke-ember" />
        <rect x="19" y="14.5" width="6" height="3" rx="1" className="fill-gold" />
      </svg>
      <span>
        C<span className="text-copper">Forge</span>
      </span>
    </span>
  );
}

export function DemoBadge({ children = "Demo data" }: { children?: ReactNode }) {
  return <Badge variant="demo">{children}</Badge>;
}
export function PendingBadge({ children = "Pending integration" }: { children?: ReactNode }) {
  return <Badge variant="pending">{children}</Badge>;
}

export function SourceNotice({ what = "This content" }: { what?: string }) {
  return (
    <div role="note" className="flex flex-wrap items-center gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-foreground">
      <DemoBadge>Demonstration material</DemoBadge>
      <span>{what} is generated from the syllabus structure and is pending integration of the original teaching package.</span>
    </div>
  );
}

export function PageHeader({ eyebrow, title, lede, actions, crumbs }: { eyebrow?: string; title: ReactNode; lede?: ReactNode; actions?: ReactNode; crumbs?: { label: string; to?: string; params?: Record<string, string> }[] }) {
  return (
    <header className="mb-8">
      {crumbs && (
        <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1">
              {c.to ? (
                <Link to={c.to as never} params={c.params as never} className="hover:text-foreground hover:underline">
                  {c.label}
                </Link>
              ) : (
                <span aria-current="page" className="text-foreground">{c.label}</span>
              )}
              {i < crumbs.length - 1 && <span aria-hidden>/</span>}
            </span>
          ))}
        </nav>
      )}
      {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl">
          <h1 className="font-display text-3xl font-semibold leading-tight md:text-5xl">{title}</h1>
          {lede && <p className="mt-3 text-base text-muted-foreground md:text-lg">{lede}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}

const STATE_META: Record<MasteryState, { label: string; cls: string }> = {
  "not-started": { label: "Not started", cls: "bg-muted text-muted-foreground" },
  opened: { label: "Recently opened", cls: "bg-info/15 text-info" },
  demonstrated: { label: "Demonstrated", cls: "bg-gold/25 text-foreground" },
  mastered: { label: "Mastered", cls: "bg-success/15 text-success" },
  "needs-practice": { label: "Needs more practice", cls: "bg-copper/15 text-copper" },
};
export function StateChip({ state }: { state: MasteryState }) {
  const m = STATE_META[state];
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium", m.cls)}>{m.label}</span>;
}
export const stateLabel = (s: MasteryState) => STATE_META[s].label;

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-surface-1/60 p-8 text-center">
      <p className="font-display text-lg">{title}</p>
      {body && <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Panel({ className, children, as: As = "section" }: { className?: string; children: ReactNode; as?: "section" | "div" | "article" }) {
  const dark = className?.includes("surface-ink");
  return <As className={cn(dark ? "glass-dark" : "glass-panel", "rounded-3xl p-5", !dark && "text-card-foreground", className)}>{children}</As>;
}
