import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/common/bits";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignedInRedirect } from "@/components/auth/SignedInRedirect";
import { Aurora } from "@/components/art/motion";

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
    <div className="theme-faculty relative isolate flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <SignedInRedirect />
      <Aurora />
      <div className="glass-dark w-full max-w-sm rounded-[2rem] p-8">
        <Link to="/"><Logo /></Link>
        <p className="mt-6 eyebrow !text-ember">Faculty portal</p>
        <h1 className="mt-1 font-display text-3xl">Faculty access</h1>
        <p className="mb-6 mt-2 text-sm text-white/75">Manage the roster, invitations, labs and papers. The access token stays in this browser tab and is not placed in the URL.</p>
        <LoginForm role="faculty" />
        <p className="mt-6 text-sm text-white/70">Student? <Link to="/login" className="text-ember hover:underline">Student login</Link></p>
      </div>
    </div>
  );
}
