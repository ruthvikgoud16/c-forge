import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/common/bits";
import { LoginForm } from "@/components/auth/LoginForm";
import { highlightC } from "@/components/common/CodeBlock";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Student Login — CForge" },
      { name: "description", content: "Sign in to the CForge C programming academy with your roll number." },
      { property: "og:title", content: "Student Login — CForge" },
      { property: "og:description", content: "Invitation-based access for the CForge student cohort." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="theme-public grid min-h-screen md:grid-cols-2">
      <aside className="surface-ink relative hidden flex-col justify-between p-10 md:flex">
        <Link to="/"><Logo /></Link>
        <div>
          <pre className="font-mono text-sm leading-7 text-code-foreground/90">{highlightC(`while (!mastered) {\n    learn();\n    visualise();\n    practise();\n}`)}</pre>
          <p className="mt-8 font-display text-3xl">Forge your logic.<br /><span className="text-ember">Master your C.</span></p>
        </div>
        <p className="text-xs text-muted-foreground">Access is by faculty invitation only.</p>
      </aside>
      <main className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="md:hidden"><Logo /></Link>
          <p className="eyebrow mt-8 md:mt-0">Student access</p>
          <h1 className="mt-2 font-display text-4xl">Welcome back</h1>
          <p className="mb-8 mt-2 text-sm text-muted-foreground">Sign in with your roll number. New here? Use the invitation link from your faculty.</p>
          <LoginForm role="student" />
          <p className="mt-6 text-sm text-muted-foreground">Faculty member? <Link to="/faculty-login" className="text-copper underline-offset-4 hover:underline">Faculty access</Link></p>
          <p className="mt-2 text-sm text-muted-foreground">Have an invitation? Try <Link to="/join/$token" params={{ token: "demo-DEMO-040" }} className="text-copper underline-offset-4 hover:underline">a demo invitation</Link>.</p>
        </div>
      </main>
    </div>
  );
}
