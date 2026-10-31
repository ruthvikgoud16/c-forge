import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Logo, DemoBadge } from "@/components/common/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { services } from "@/services";

export const Route = createFileRoute("/join/$token")({
  loader: ({ params }) => services.invitations.lookup(params.token),
  head: () => ({
    meta: [
      { title: "Accept Invitation — CForge" },
      { name: "description", content: "Accept your CForge invitation and create your password." },
      { property: "og:title", content: "Accept Invitation — CForge" },
      { property: "og:description", content: "Join your CForge C programming cohort." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Join,
});

function Join() {
  const data = Route.useLoaderData();
  const { token } = Route.useParams();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return setErr("Password must be at least 8 characters.");
    if (pw !== pw2) return setErr("Passwords do not match.");
    const r = await services.invitations.accept(token, pw);
    if (!r.ok) return setErr(r.error);
    setDone(true);
  }

  return (
    <div className="theme-public flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-[var(--shadow-lift)]">
        <Link to="/"><Logo /></Link>
        <div className="mt-4"><DemoBadge>Demo onboarding</DemoBadge></div>
        {"error" in data ? (
          <>
            <h1 className="mt-4 font-display text-3xl">Invitation not found</h1>
            <p className="mt-2 text-sm text-muted-foreground">This link is invalid. Ask your faculty for a new invitation.</p>
            <Button asChild variant="quiet" className="mt-6"><Link to="/login">Back to login</Link></Button>
          </>
        ) : done ? (
          <div className="mt-4 text-center">
            <CheckCircle2 className="mx-auto size-10 text-success" />
            <h1 className="mt-3 font-display text-3xl">You're in</h1>
            <p className="mt-2 text-sm text-muted-foreground">Onboarding simulated for <span className="font-mono">{data.invitation.rollNumber}</span>. No account was created on a real server.</p>
            <Button asChild variant="hero" className="mt-6"><Link to="/login">Continue to login</Link></Button>
          </div>
        ) : (
          <>
            <h1 className="mt-4 font-display text-3xl">Join CForge</h1>
            <dl className="mt-4 grid grid-cols-2 gap-3 rounded-md bg-surface-2 p-3 text-sm">
              <div><dt className="text-xs text-muted-foreground">Roll number</dt><dd className="font-mono">{data.invitation.rollNumber}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Status</dt><dd className="capitalize">{data.invitation.status}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Expires</dt><dd>{data.invitation.expiresAt}</dd></div>
            </dl>
            {data.invitation.status !== "pending" ? (
              <p role="alert" className="mt-6 text-sm text-destructive">This invitation is {data.invitation.status} and can no longer be used.</p>
            ) : (
              <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
                {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
                <div className="space-y-1.5"><Label htmlFor="p1">Create password</Label><Input id="p1" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} className="h-11" /></div>
                <div className="space-y-1.5"><Label htmlFor="p2">Confirm password</Label><Input id="p2" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} className="h-11" /></div>
                <Button type="submit" variant="hero" className="h-11 w-full">Accept invitation</Button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
