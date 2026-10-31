import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/common/bits";
import { LoginForm } from "@/components/auth/LoginForm";

export const Route = createFileRoute("/faculty-login")({
  head: () => ({
    meta: [
      { title: "Faculty Access — CForge" },
      { name: "description", content: "Faculty sign-in for managing the CForge cohort roster and invitations." },
      { property: "og:title", content: "Faculty Access — CForge" },
      { property: "og:description", content: "Separate faculty access to the CForge portal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FacultyLogin,
});

function FacultyLogin() {
  return (
    <div className="theme-faculty flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-[var(--shadow-lift)]">
        <Link to="/"><Logo mono /></Link>
        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-info">Faculty portal</p>
        <h1 className="mt-1 font-display text-3xl">Faculty access</h1>
        <p className="mb-6 mt-2 text-sm text-muted-foreground">Manage the roster, invitations and cohort learning summaries.</p>
        <LoginForm role="faculty" />
        <p className="mt-6 text-sm text-muted-foreground">Student? <Link to="/login" className="text-primary hover:underline">Student login</Link></p>
      </div>
    </div>
  );
}
