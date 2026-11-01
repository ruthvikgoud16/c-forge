import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { Topic, Unit } from "@/domain/types";
import { PageHeader } from "@/components/common/bits";
import { UnitArt } from "@/components/art/UnitArt";
import type { TeachingKind, TeachingPackage } from "@/lib/teaching";
import { destForTeachingKind, destLink } from "@/lib/teaching";

const CORE = [
  { kind: "overview", label: "Overview" },
  { kind: "lesson", label: "Lesson" },
  { kind: "notes", label: "Notes" },
  { kind: "oneshot", label: "One-shot" },
  { kind: "flashcards", label: "Flashcards" },
  { kind: "mind-map", label: "Mind map" },
] as const;

const EXTRA: Array<{ kind: TeachingKind; label: string }> = [
  { kind: "quick", label: "Quick" },
  { kind: "concepts", label: "Concepts" },
  { kind: "examples", label: "Examples" },
  { kind: "trace", label: "Trace" },
  { kind: "predict", label: "Predict" },
  { kind: "syntax", label: "Syntax" },
  { kind: "practice", label: "Practice" },
];

function hrefFor(topicId: string, kind: string) {
  if (kind === "overview") return { to: "/learn/topics/$topicId" as const, params: { topicId } };
  if (kind === "lesson") return { to: "/learn/topics/$topicId/lesson" as const, params: { topicId } };
  return destForTeachingKind(topicId, kind as TeachingKind);
}

export function TopicShell({ topic, unit, title, children, prev, next, teaching }: {
  topic: Topic;
  unit: Unit | null;
  title?: string;
  children: ReactNode;
  prev?: Topic | null;
  next?: Topic | null;
  teaching?: TeachingPackage | null;
}) {
  const packaged = Boolean(teaching?.availableKinds.length);
  const core = packaged ? CORE : CORE.filter((tab) => tab.kind === "overview");
  const extras = EXTRA.filter((tab) => teaching?.availableKinds.includes(tab.kind));
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
          {core.map((tab) => {
            const dest = destLink(hrefFor(topic.id, tab.kind));
            return (
              <li key={tab.kind}>
                <Link to={dest.to} params={dest.params} activeOptions={{ exact: tab.kind === "overview" }} className="press block rounded-full px-4 py-1.5 text-muted-foreground transition-colors hover:text-foreground" activeProps={{ className: "bg-copper !text-pearl shadow", "aria-current": "page" }}>{tab.label}</Link>
              </li>
            );
          })}
          {extras.map((tab) => {
            const dest = destLink(hrefFor(topic.id, tab.kind));
            return (
              <li key={tab.kind}>
                <Link to={dest.to} params={dest.params} className="press block rounded-full px-4 py-1.5 text-muted-foreground transition-colors hover:text-foreground" activeProps={{ className: "bg-copper !text-pearl shadow", "aria-current": "page" }}>{tab.label}</Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {children}
      {(prev !== undefined || next !== undefined) && (
        <nav aria-label="Sequential" className="mt-12 grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
          {prev ? <Link to="/learn/topics/$topicId" params={{ topicId: prev.id }} className="rounded-lg border border-border p-4 hover:border-copper"><span className="text-xs text-muted-foreground">← Previous</span><span className="block font-medium">{prev.title}</span></Link> : <span />}
          {next && <Link to="/learn/topics/$topicId" params={{ topicId: next.id }} className="rounded-lg border border-border p-4 text-right hover:border-copper"><span className="text-xs text-muted-foreground">Next →</span><span className="block font-medium">{next.title}</span></Link>}
        </nav>
      )}
    </>
  );
}
