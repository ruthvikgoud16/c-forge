import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { DemoBadge, PageHeader } from "@/components/common/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Reveal } from "@/components/art/motion";
import { MEMORY_NOTE } from "@/lib/resources";
import { IS_DEMO, services } from "@/services";
import { rethrowIfRedirect } from "@/services/cforge-api";

export const Route = createFileRoute("/faculty/labs")({
  head: () => ({ meta: [{ title: "Faculty Labs — CForge" }] }),
  component: FacultyLabsPage,
});

function FacultyLabsPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, error: loadError } = useQuery({ queryKey: ["faculty-labs"], queryFn: () => services.facultyResources.labs(), retry: false });
  const [unitId, setUnitId] = useState("");
  const [title, setTitle] = useState("");
  const [sourceRef, setSourceRef] = useState("");
  const [objective, setObjective] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const result = await services.facultyResources.addLab({ unitId, title, sourceRef, objective });
      setOk(result.demo
        ? "Stored in this demo session only. Not sent to the CForge backend."
        : `Stored. ${MEMORY_NOTE}`);
      setUnitId("");
      setTitle("");
      setSourceRef("");
      setObjective("");
      await qc.invalidateQueries({ queryKey: ["faculty-labs"] });
    } catch (cause) {
      rethrowIfRedirect(cause);
      setError(cause instanceof Error ? cause.message : "Could not store the lab.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Faculty · labs"
        title={<>Ingest a <em className="text-copper">lab</em></>}
        lede="This sends JSON to the existing faculty labs endpoint. There is no file upload, edit, or delete route."
        actions={IS_DEMO ? <DemoBadge>Demo — not the CForge backend</DemoBadge> : undefined}
      />
      <p className="text-sm text-muted-foreground">{IS_DEMO ? "Demo labs stay in this browser session." : MEMORY_NOTE}</p>

      <section className="glass-panel rounded-[1.75rem] p-6">
        <h2 className="font-display text-2xl">Required fields</h2>
        <p className="mt-1 text-sm text-muted-foreground">unitId, title, and sourceRef are required. objective is optional. Duplicate checks are not performed by the server.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="lab-unit">Unit id</Label>
            <Input id="lab-unit" value={unitId} onChange={(e) => setUnitId(e.target.value)} placeholder="unit-1" />
          </div>
          <div>
            <Label htmlFor="lab-title">Title</Label>
            <Input id="lab-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="lab-source">Source reference</Label>
            <Input id="lab-source" value={sourceRef} onChange={(e) => setSourceRef(e.target.value)} placeholder="Faculty note or http(s) link" />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="lab-objective">Objective (optional)</Label>
            <Textarea id="lab-objective" value={objective} onChange={(e) => setObjective(e.target.value)} rows={3} />
          </div>
        </div>
        {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
        {ok && <p className="mt-3 text-sm text-muted-foreground" data-testid="lab-stored">{ok}</p>}
        <Button variant="hero" className="mt-4" disabled={busy} onClick={submit} data-testid="lab-submit">
          {busy ? "Storing…" : "Store lab JSON"}
        </Button>
      </section>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading stored labs…</p> : isError ? (
        <p className="glass-panel rounded-3xl p-5 text-sm text-muted-foreground">{loadError instanceof Error ? loadError.message : "The faculty labs API did not return a list."}</p>
      ) : (
        <section className="space-y-3">
          <h2 className="font-display text-2xl">Stored labs</h2>
          {(data?.labs.length ?? 0) === 0 ? (
            <p className="glass-panel rounded-3xl p-5 text-sm text-muted-foreground" data-testid="faculty-labs-empty">No labs are in process memory yet.</p>
          ) : data?.labs.map((lab, i) => (
            <Reveal key={lab.id} delay={i * 40} className="glass-panel rounded-3xl p-5">
              <p className="font-mono text-xs text-muted-foreground">{lab.unitId}{lab.uploadedAt ? ` · ${lab.uploadedAt}` : ""}</p>
              <h3 className="font-display text-xl">{lab.title}</h3>
              {lab.objective ? <p className="mt-1 text-sm text-muted-foreground">{lab.objective}</p> : null}
              <p className="mt-1 text-sm text-muted-foreground">{lab.sourceRef}</p>
              <p className="mt-2 text-xs text-muted-foreground">{lab.verified ? "Faculty marked this as verified." : "Not marked verified."} No edit or delete route is offered.</p>
            </Reveal>
          ))}
        </section>
      )}
    </div>
  );
}
