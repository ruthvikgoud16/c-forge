import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { Topic, Unit } from "@/domain/types";
import { PageHeader } from "@/components/common/bits";
import { UnitArt } from "@/components/art/UnitArt";

const TABS = [
  { to: "/learn/topics/$topicId", label: "Overview", exact: true },
  { to: "/learn/topics/$topicId/lesson", label: "Lesson" },
  { to: "/learn/topics/$topicId/notes", label: "Notes" },
  { to: "/learn/topics/$topicId/resources", label: "One-shot" },
  { to: "/learn/topics/$topicId/flashcards", label: "Flashcards" },
  { to: "/learn/topics/$topicId/mind-map", label: "Mind map" },
] as const;

export function TopicShell({ topic, unit, title, children, prev, next }: { topic: Topic; unit: Unit | null; title?: string; children: ReactNode; prev?: Topic | null; next?: Topic | null }) {
  return (
    <>
      <PageHeader
        crumbs={[{ label: "Units", to: "/learn/units" }, ...(unit ? [{ label: `Unit ${unit.number}`, to: "/learn/units/$unitId", params: { unitId: unit.id } }] : [{ label: "Supplementary" }]), { label: topic.title }]}
        eyebrow={unit ? `Unit ${unit.number} · Package ${String(topic.order).padStart(2, "0")}` : "Supplementary package"}
        title={title ?? topic.title}
        actions={<UnitArt unitId={topic.unitId} label={false} className="cf-rise h-24 w-40" />}
      />
      <nav aria-label="Topic resources" className="-mt-2 mb-8 overflow-x-auto rounded-full glass-panel p-1">
        <ul className="flex gap-1 whitespace-nowrap text-sm">
          {TABS.map((t) => (
            <li key={t.to}>
              <Link to={t.to} params={{ topicId: topic.id }} activeOptions={{ exact: "exact" in t }} className="press block rounded-full px-4 py-1.5 text-muted-foreground transition-colors hover:text-foreground" activeProps={{ className: "bg-copper !text-pearl shadow", "aria-current": "page" }}>{t.label}</Link>
            </li>
          ))}
        </ul>
      </nav>
      {children}
      {(prev !== undefined || next !== undefined) && (
        <nav aria-label="Sequential" className="mt-12 grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
          {prev ? <Link to="/learn/topics/$topicId/lesson" params={{ topicId: prev.id }} className="rounded-lg border border-border p-4 hover:border-copper"><span className="text-xs text-muted-foreground">← Previous</span><span className="block font-medium">{prev.title}</span></Link> : <span />}
          {next && <Link to="/learn/topics/$topicId/lesson" params={{ topicId: next.id }} className="rounded-lg border border-border p-4 text-right hover:border-copper"><span className="text-xs text-muted-foreground">Next →</span><span className="block font-medium">{next.title}</span></Link>}
        </nav>
      )}
    </>
  );
}
