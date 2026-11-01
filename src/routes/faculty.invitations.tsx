import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { MailPlus, Ban } from "lucide-react";
import { IS_DEMO, services } from "@/services";
import { PageHeader, Panel, DemoBadge, EmptyState } from "@/components/common/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { Invitation, InvitationStatus } from "@/domain/types";
import { Donut } from "@/components/art/Ring";

export const Route = createFileRoute("/faculty/invitations")({ component: FacultyInvitations });

const STATUS_META: Record<InvitationStatus, { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "bg-info/15 text-info" },
  accepted: { label: "Accepted", cls: "bg-success/15 text-success" },
  expired: { label: "Expired", cls: "bg-warning/15 text-warning" },
  revoked: { label: "Revoked", cls: "bg-destructive/15 text-destructive" },
};

const STATUS_COLOR: Record<InvitationStatus, string> = { pending: "oklch(0.7 0.15 230)", accepted: "oklch(0.62 0.17 150)", expired: "oklch(0.78 0.16 70)", revoked: "oklch(0.63 0.22 25)" };

function Chip({ status }: { status: InvitationStatus }) {
  const m = STATUS_META[status];
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${m.cls}`}>{m.label}</span>;
}

function FacultyInvitations() {
  const qc = useQueryClient();
  const { data: invitations = [], isLoading, isError, error } = useQuery({
    queryKey: ["faculty-invitations"],
    queryFn: () => services.invitations.list(),
    enabled: typeof window !== "undefined",
    retry: false,
  });
  const { data: roster = [] } = useQuery({
    queryKey: ["faculty-roster"],
    queryFn: () => services.faculty.roster(),
    enabled: typeof window !== "undefined",
  });

  const [filter, setFilter] = useState<"all" | InvitationStatus>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [newRoll, setNewRoll] = useState("");
  const [createdJoinPath, setCreatedJoinPath] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const sorted: Invitation[] = [...invitations].sort((a, b) => a.rollNumber.localeCompare(b.rollNumber));
    return filter === "all" ? sorted : sorted.filter((i) => i.status === filter);
  }, [invitations, filter]);

  const eligible = useMemo(() => roster.filter((r) => r.status === "not-invited"), [roster]);

  async function create() {
    const roll = newRoll.trim().toUpperCase();
    if (!roll) {
      toast.error("Pick a roll number from the roster.");
      return;
    }
    try {
      const created = await services.invitations.create(roll);
      setCreatedJoinPath(created.oneTimeJoinPath ?? null);
      toast.success(IS_DEMO ? `Invitation created for ${roll} (demo-only).` : `Invitation created for ${roll}. Copy the one-time join link now; it is not stored in this list.`);
      setCreateOpen(false);
      setNewRoll("");
      qc.invalidateQueries({ queryKey: ["faculty-invitations"] });
      qc.invalidateQueries({ queryKey: ["faculty-roster"] });
      qc.invalidateQueries({ queryKey: ["faculty-summary"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create invitation.");
    }
  }

  async function revoke(id: string) {
    try {
      await services.invitations.revoke(id);
      toast.success(IS_DEMO ? "Invitation revoked (demo-only)." : "Invitation revoked.");
      qc.invalidateQueries({ queryKey: ["faculty-invitations"] });
      qc.invalidateQueries({ queryKey: ["faculty-roster"] });
      qc.invalidateQueries({ queryKey: ["faculty-summary"] });
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "The invitation was not revoked.");
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Faculty · invitations"
        title={<>Invitation <em className="text-copper">management</em></>}
        lede="Create invitations bound to a roll number, review status, and revoke outstanding ones. The join link is shown once at create time. Stored token hashes and passwords are never listed."
        actions={
          <>
            {IS_DEMO && <DemoBadge>Demo mode</DemoBadge>}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button data-testid="invitation-create-btn"><MailPlus className="size-4" /> New invitation</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create invitation</DialogTitle>
                  <DialogDescription>
                    {IS_DEMO ? "Pick an un-invited roll number from the roster. The invitation lasts 14 days in demo mode. Students use the acceptance page to set their own password." : "The server creates the invitation. The one-time join link appears once after create so you can send it to the student."}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <Label>Roll number</Label>
                  <Select value={newRoll} onValueChange={setNewRoll}>
                    <SelectTrigger data-testid="invitation-roll-select">
                      <SelectValue placeholder={eligible.length ? "Choose a roll number" : "No eligible roll numbers"} />
                    </SelectTrigger>
                    <SelectContent>
                      {eligible.map((r) => (
                        <SelectItem key={r.id} value={r.rollNumber}>
                          <span className="font-mono text-xs">{r.rollNumber}</span> — {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                  <Button onClick={create} data-testid="invitation-create-submit" disabled={!newRoll}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={!!createdJoinPath} onOpenChange={(open) => { if (!open) setCreatedJoinPath(null); }}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>One-time join link</DialogTitle>
                  <DialogDescription>Copy this link now. It is not stored on the invitation list. The student uses it to set their own password.</DialogDescription>
                </DialogHeader>
                {createdJoinPath ? (
                  <Input readOnly value={`${window.location.origin}${createdJoinPath}`} className="font-mono text-xs" data-testid="invitation-join-link" />
                ) : null}
                <DialogFooter>
                  <Button
                    type="button"
                    onClick={async () => {
                      if (!createdJoinPath) return;
                      await navigator.clipboard.writeText(`${window.location.origin}${createdJoinPath}`);
                      toast.success("Join link copied.");
                    }}
                  >
                    Copy link
                  </Button>
                  <Button variant="outline" onClick={() => setCreatedJoinPath(null)}>Done</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-[auto_1fr]" data-testid="invitation-status-visual">
        <Panel className="flex items-center justify-center">
          <Donut size={150} stroke={20} parts={(Object.keys(STATUS_META) as InvitationStatus[]).map((k) => ({ label: STATUS_META[k].label, value: invitations.filter((x) => x.status === k).length, color: STATUS_COLOR[k] }))}>
            <span><span className="block font-display text-3xl">{invitations.length}</span><span className="text-[10px] text-muted-foreground">invitations</span></span>
          </Donut>
        </Panel>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {(Object.keys(STATUS_META) as InvitationStatus[]).map((k) => {
            const n = invitations.filter((x) => x.status === k).length;
            return (
              <button key={k} type="button" onClick={() => setFilter(filter === k ? "all" : k)} data-testid={`invitation-tile-${k}`} className={`press lift glass-panel rounded-3xl p-4 text-left ${filter === k ? "ring-2 ring-copper" : ""}`}>
                <span className="block size-3 rounded-full" style={{ background: STATUS_COLOR[k] }} />
                <span className="mt-3 block font-display text-3xl">{n}</span>
                <span className="text-sm text-muted-foreground">{STATUS_META[k].label}</span>
                <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-foreground/8"><span className="block h-full rounded-full transition-all duration-700" style={{ width: `${invitations.length ? (n / invitations.length) * 100 : 0}%`, background: STATUS_COLOR[k] }} /></span>
              </button>
            );
          })}
        </div>
      </section>

      <Panel>
        <div className="flex items-center justify-between gap-3">
          <Select value={filter} onValueChange={(v) => setFilter(v as "all" | InvitationStatus)}>
            <SelectTrigger className="w-48" data-testid="invitations-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="revoked">Revoked</SelectItem>
            </SelectContent>
          </Select>
          <p className="font-mono text-xs text-muted-foreground">
            {filtered.length} invitation{filtered.length === 1 ? "" : "s"} shown
          </p>
        </div>

        <div className="mt-5 overflow-x-auto">
          {isLoading ? (
            <p className="animate-pulse text-sm text-muted-foreground">Loading invitations…</p>
          ) : isError ? (
            <EmptyState title="Invitations unavailable" body={error instanceof Error ? error.message : "The faculty invitations API did not return a list. No invitation was invented."} />
          ) : filtered.length === 0 ? (
            <EmptyState title="No invitations" body="Create a new invitation for a roster entry to see it listed here." />
          ) : (
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 pr-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Roll</th>
                  <th className="py-2 pr-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Status</th>
                  <th className="py-2 pr-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Created</th>
                  <th className="py-2 pr-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Expires</th>
                  <th className="py-2 pr-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => (
                  <tr key={inv.id} className="border-b border-border/60" data-testid={`invitation-row-${inv.rollNumber}`}>
                    <td className="py-2 pr-3 font-mono text-xs">{inv.rollNumber}</td>
                    <td className="py-2 pr-3"><Chip status={inv.status} /></td>
                    <td className="py-2 pr-3 font-mono text-xs">{inv.createdAt || "—"}</td>
                    <td className="py-2 pr-3 font-mono text-xs">{inv.expiresAt}</td>
                    <td className="py-2 pr-3">
                      {inv.status === "pending" ? (
                        <button
                          type="button"
                          onClick={() => revoke(inv.id)}
                          className="inline-flex items-center gap-1 text-destructive hover:underline"
                          data-testid={`invitation-revoke-${inv.rollNumber}`}
                        >
                          <Ban className="size-3.5" /> Revoke
                        </button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <p className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">
          Passwords and stored invitation token hashes are never displayed in the faculty portal. Students receive their invitation link separately and set their own password.
        </p>
      </Panel>
    </div>
  );
}
