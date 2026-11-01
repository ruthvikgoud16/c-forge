import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, FileSpreadsheet, UserCog, X } from "lucide-react";
import { IS_DEMO, services } from "@/services";
import { PageHeader, Panel, DemoBadge, EmptyState } from "@/components/common/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { AccountStatus, RosterEntry } from "@/domain/types";

export const Route = createFileRoute("/faculty/roster")({
  ssr: false,
  component: FacultyRoster,
});

const STATUS_META: Record<AccountStatus, { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-success/15 text-success" },
  invited: { label: "Invited", cls: "bg-info/15 text-info" },
  "not-invited": { label: "Not invited", cls: "bg-muted text-muted-foreground" },
};

function StatusChip({ status }: { status: AccountStatus }) {
  const m = STATUS_META[status];
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${m.cls}`}>{m.label}</span>;
}

function FacultyRoster() {
  const qc = useQueryClient();
  const { data: roster = [], isLoading, isError, error } = useQuery({
    queryKey: ["faculty-roster"],
    queryFn: () => services.faculty.roster(),
    retry: 1,
  });
  const { data: summary } = useQuery({
    queryKey: ["faculty-summary"],
    queryFn: () => services.faculty.summary(),
    retry: 1,
  });

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AccountStatus>("all");
  const [renameOpen, setRenameOpen] = useState<RosterEntry | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [csv, setCsv] = useState("roll_number,name\nDEMO-056,Example Student");

  const filtered = useMemo(() => {
    const lower = q.trim().toLowerCase();
    return roster.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!lower) return true;
      return r.rollNumber.toLowerCase().includes(lower) || r.name.toLowerCase().includes(lower);
    });
  }, [roster, q, statusFilter]);

  async function submitRename() {
    if (!renameOpen || renameValue.trim().length < 2) {
      toast.error("Name must be at least 2 characters.");
      return;
    }
    try {
      await services.faculty.rename(renameOpen.id, renameValue.trim());
      toast.success(IS_DEMO ? "Name updated (demo-only)." : "Name updated on the official roster.");
      setRenameOpen(null);
      setRenameValue("");
      qc.invalidateQueries({ queryKey: ["faculty-roster"] });
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "The roster rename was not saved.");
    }
  }

  async function submitImport() {
    const res = await services.faculty.importCsv(csv);
    if (res.errors.length) {
      toast.error(`${res.errors.length} line(s) could not be imported. ${res.errors[0]}`);
    }
    if (res.added > 0 || res.errors.length === 0) {
      toast.success(`Imported ${res.added} new entries, skipped ${res.skipped} duplicates.`);
    }
    setImportOpen(false);
    qc.invalidateQueries({ queryKey: ["faculty-roster"] });
    qc.invalidateQueries({ queryKey: ["faculty-summary"] });
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Faculty · roster"
        title={<>Cohort <em className="text-copper">roster</em></>}
        lede={IS_DEMO ? "Search, filter and manage approved roster entries. Rename students, bulk-import roll numbers from CSV, and open student detail pages." : "Official 55-student roster names come from the verified 2026-10-31 CSV. Accounts stay invitation-only. Date of birth is not listed here."}
        actions={
          <>
            {IS_DEMO && <DemoBadge>Demo data</DemoBadge>}
            {IS_DEMO ? <Dialog open={importOpen} onOpenChange={setImportOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="roster-import-btn"><FileSpreadsheet className="size-4" /> Import CSV</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import roster from CSV</DialogTitle>
                  <DialogDescription>
                    {IS_DEMO ? <>Paste CSV with the header row <code className="font-mono">roll_number,name</code>. Duplicates by roll number are skipped. Capacity is 55.</> : "Paste import is not supported. The server imports a verified roster file, not pasted CSV."}
                  </DialogDescription>
                </DialogHeader>
                <Textarea
                  rows={10}
                  value={csv}
                  onChange={(e) => setCsv(e.target.value)}
                  className="font-mono text-xs"
                  data-testid="roster-import-textarea"
                />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setImportOpen(false)}>Cancel</Button>
                  <Button onClick={submitImport} data-testid="roster-import-submit">Import (demo)</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog> : <p className="max-w-xs text-xs text-muted-foreground">Paste CSV import is not supported. The server imports a verified roster file.</p>}
          </>
        }
      />

      <div className="grid grid-cols-3 gap-3" data-testid="roster-status-visual">
        {(Object.keys(STATUS_META) as AccountStatus[]).map((k) => {
          const n = roster.filter((r) => r.status === k).length;
          return (
            <button key={k} type="button" onClick={() => setStatusFilter(statusFilter === k ? "all" : k)} className={`press lift glass-panel rounded-3xl p-4 text-left ${statusFilter === k ? "ring-2 ring-copper" : ""}`} data-testid={`roster-tile-${k}`}>
              <span className="text-sm text-muted-foreground">{STATUS_META[k].label}</span>
              <span className="mt-1 block font-display text-3xl">{n}</span>
              <span className="mt-2 flex gap-0.5">{Array.from({ length: 11 }, (_, s) => <span key={s} className={`h-1.5 flex-1 rounded-full ${s < Math.round((n / Math.max(1, roster.length)) * 11) ? (k === "active" ? "bg-success" : k === "invited" ? "bg-info" : "bg-foreground/30") : "bg-foreground/8"}`} />)}</span>
            </button>
          );
        })}
      </div>

      <Panel>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              data-testid="roster-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by roll number or name"
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "all" | AccountStatus)}>
            <SelectTrigger className="w-full md:w-56" data-testid="roster-status-filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="invited">Invited</SelectItem>
              <SelectItem value="not-invited">Not invited</SelectItem>
            </SelectContent>
          </Select>
          <p className="font-mono text-xs text-muted-foreground">
            Showing {filtered.length} of {roster.length}{summary ? ` · capacity ${summary.capacity}` : ""}
          </p>
        </div>

        <div className="mt-5 overflow-x-auto">
          {isLoading ? (
            <p className="animate-pulse text-sm text-muted-foreground">Loading roster…</p>
          ) : isError ? (
            <EmptyState title="Roster unavailable" body={error instanceof Error ? error.message : "The faculty roster API did not return entries. No students were invented."} />
          ) : filtered.length === 0 ? (
            <EmptyState title="No roster entries match" body="Try clearing filters or adjusting your search." />
          ) : (
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 pr-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Roll</th>
                  <th className="py-2 pr-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Name</th>
                  <th className="py-2 pr-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Status</th>
                  <th className="py-2 pr-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Invitation</th>
                  <th className="py-2 pr-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-foreground/5 transition-colors hover:bg-white/60" data-testid={`roster-row-${r.rollNumber}`}>
                    <td className="py-2 pr-3 font-mono text-xs">{r.rollNumber}</td>
                    <td className="py-2 pr-3 font-medium"><span className="flex items-center gap-2"><span className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-copper to-ember font-mono text-[10px] text-pearl">{r.name.split(" ").map((p) => p[0]).join("")}</span>{r.name}</span></td>
                    <td className="py-2 pr-3"><StatusChip status={r.status} /></td>
                    <td className="py-2 pr-3 font-mono text-xs text-muted-foreground">
                      {r.invitation ? r.invitation.status : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="py-2 pr-3">
                      <div className="flex gap-2">
                        <Link
                          to="/faculty/students/$studentId"
                          params={{ studentId: r.id }}
                          className="text-copper hover:underline"
                          data-testid={`roster-view-${r.rollNumber}`}
                        >
                          View
                        </Link>
                        <button
                          type="button"
                          onClick={() => { setRenameOpen(r); setRenameValue(r.name); }}
                          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                          data-testid={`roster-rename-${r.rollNumber}`}
                        >
                          <UserCog className="size-3.5" /> Rename
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Panel>

      <Dialog open={!!renameOpen} onOpenChange={(o) => { if (!o) setRenameOpen(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename student</DialogTitle>
            <DialogDescription>
              {IS_DEMO
                ? "Updating display name only. Roll number stays the same. This change persists only in this demo session."
                : "Updating display name only. Roll number stays the same. The change is stored with the official roster and does not create an account."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rename-input">Full name</Label>
            <Input
              id="rename-input"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              data-testid="rename-input"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(null)}><X className="size-4" /> Cancel</Button>
            <Button onClick={submitRename} data-testid="rename-submit">Save name</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
