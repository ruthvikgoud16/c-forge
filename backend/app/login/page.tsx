import type { Metadata } from "next";
import Link from "next/link";
import { StudentLoginForm } from "@/components/auth/student-login-form";
import { HighlightLines } from "@/components/public/highlight-c";
import { Logo } from "@/components/public/logo";
import "@/app/styles/emergent.css";

export const metadata: Metadata = {
  title: "Student Login — CForge",
  description: "Sign in to the CForge C programming academy with your roll number.",
};

export default function LoginPage() {
  return (
    <div className="em em-login">
      <aside className="em-ink em-login-aside">
        <Link href="/" aria-label="CForge home">
          <Logo />
        </Link>
        <div>
          <HighlightLines code={"while (!mastered) {\n    learn();\n    visualise();\n    practise();\n}"} />
          <p className="em-display" style={{ fontSize: "1.8rem" }}>
            Forge your logic.
            <br />
            <span className="em-copper">Master your C.</span>
          </p>
        </div>
        <p className="em-muted">Access is by faculty invitation only.</p>
      </aside>
      <main className="em-login-main">
        <div className="em-form">
          <Link href="/" className="em-login-home">
            <Logo />
          </Link>
          <p className="em-eyebrow">Student access</p>
          <h1 className="em-display" style={{ fontSize: "2.4rem", margin: 0 }}>
            Welcome back
          </h1>
          <p className="em-muted">
            Sign in with your roll number. New here? Use the invitation link from your faculty.
          </p>
          <StudentLoginForm />
          <p className="em-muted">
            Faculty member?{" "}
            <Link className="em-copper" href="/faculty">
              Faculty access
            </Link>
          </p>
          <p className="em-muted">
            Have an invitation?{" "}
            <Link className="em-copper" href="/join">
              Join with invitation
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
