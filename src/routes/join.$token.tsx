import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Logo, DemoBadge } from "@/components/common/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IS_DEMO, services } from "@/services";

export const Route = createFileRoute("/join/$token")({
  validateSearch: (search: Record<string, unknown>) => ({
    roll: typeof search["roll"] === "string" ? search["roll"].trim() : "",
  }),
  loader: async ({ params, location }) => {
    const looked = await services.invitations.lookup(params.token);
    if (!("error" in looked)) return looked;
    const roll = "search" in location && location.search && typeof location.search === "object" && "roll" in location.search
      ? String((location.search as { roll?: string }).roll ?? "").trim()
      : "";
    if (!roll) return looked;
    return {
      invitation: {
        id: params.token,
        rollNumber: roll,
        status: "pending" as const,
        createdAt: "",
        expiresAt: "",
      },
    };
  },
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
  errorComponent: JoinUnavailable,
  component: Join,
});

function JoinUnavailable() {
  return (
    <div className="theme-public flex min-h-screen items-center justify-center px-4 py-12">
      <div className="glass-panel w-full max-w-md rounded-[2rem] p-8">
        <Link to="/"><Logo /></Link>
        <h1 className="mt-4 font-display text-3xl">Invitation unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">The invitation API did not return this token. No invitation was invented.</p>
        <Button asChild variant="quiet" className="mt-6"><Link to="/login">Back to login</Link></Button>
      </div>
    </div>
  );
}

function Join() {
  const data = Route.useLoaderData();
  const { token } = Route.useParams();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < (IS_DEMO ? 8 : 10)) return setErr(`Password must be at least ${IS_DEMO ? 8 : 10} characters.`);
    if (pw !== pw2) return setErr("Passwords do not match.");
    const roll = "invitation" in data ? data.invitation.rollNumber : "";
    const r = await services.invitations.accept(token, pw, roll || undefined);
    if (!r.ok) return setErr(r.error);
    setDone(true);
  }

  return (
    <div className="theme-public flex min-h-screen items-center justify-center px-4 py-12">
      <div className="glass-panel w-full max-w-md rounded-[2rem] p-8">
        <Link to="/"><Logo /></Link>
        {IS_DEMO && <div className="mt-4"><DemoBadge>Demo onboarding</DemoBadge></div>}
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
            <p className="mt-2 text-sm text-muted-foreground">
              {IS_DEMO ? (
                <>Onboarding simulated for <span className="font-mono">{data.invitation.rollNumber}</span>. No account was created on a real server.</>
              ) : (
                <>Account created for <span className="font-mono">{data.invitation.rollNumber}</span>. Sign in with this roll number and the password you just set.</>
              )}
            </p>
            <Button asChild variant="hero" className="mt-6"><Link to="/login">Continue to login</Link></Button>
          </div>
        ) : (
          <>
            <h1 className="mt-4 font-display text-3xl">Join CForge</h1>
            <dl className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-white/50 p-3 text-sm">
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
