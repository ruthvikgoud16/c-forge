import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Panel, EmptyState } from "@/components/common/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { services } from "@/services";

export const Route = createFileRoute("/learn/profile")({
  loader: () => services.student.me(),
  component: StudentProfilePage,
});

function StudentProfilePage() {
  const initial = Route.useLoaderData();
  const [profile, setProfile] = useState(initial);
  const [dob, setDob] = useState(initial.dateOfBirth ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const complete = Boolean(profile.name && profile.dateOfBirth);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const next = await services.student.updateProfile({ dateOfBirth: dob || null });
      setProfile(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The date of birth was not saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Profile"
        title="Your student profile"
        lede="Your official name and roll number come from the verified roster. Date of birth is only stored if you enter it."
      />
      <Panel>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Official name</dt>
            <dd className="mt-1 font-display text-2xl">{profile.name}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Official roll number</dt>
            <dd className="mt-1 font-mono text-lg">{profile.rollNumber}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Profile completion</dt>
            <dd className="mt-1">{complete ? "Complete" : "Date of birth still needed"}</dd>
          </div>
        </dl>
        <p className="mt-4 text-sm text-muted-foreground">Students cannot change the official roster name or roll number.</p>
      </Panel>
      <Panel>
        <form onSubmit={save} className="max-w-sm space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="dob">Date of birth</Label>
            <Input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} data-testid="profile-dob" />
            <p className="text-xs text-muted-foreground">This is never inferred. Other students cannot see it.</p>
          </div>
          {error ? <EmptyState title="Not saved" body={error} /> : null}
          <Button type="submit" variant="hero" disabled={saving} data-testid="profile-save">{saving ? "Saving…" : "Save date of birth"}</Button>
        </form>
      </Panel>
    </div>
  );
}
