import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function ProductNotice({
  eyebrow,
  title,
  body,
  children,
}: {
  eyebrow: string;
  title: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <div className="theme-public relative isolate flex min-h-screen items-center justify-center px-4 py-16">
      <div className="glass-panel w-full max-w-md rounded-[2rem] p-8 text-center">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-2 font-display text-3xl">{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{body}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>
      </div>
    </div>
  );
}

export function ProductHomeActions() {
  return (
    <>
      <Button asChild variant="hero" className="rounded-full"><Link to="/">Go home</Link></Button>
      <Button asChild variant="quiet" className="rounded-full"><Link to="/login">Student login</Link></Button>
    </>
  );
}
