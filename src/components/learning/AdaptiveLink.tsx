import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { EmergentDest } from "@/lib/adaptive";

export function AdaptiveLink({
  dest,
  className,
  children,
  testId,
}: {
  dest: EmergentDest | null;
  className?: string;
  children: ReactNode;
  testId?: string;
}) {
  if (!dest) return <span className={className}>{children}</span>;
  if ("params" in dest) {
    return (
      <Link to={dest.to} params={dest.params as never} className={className} data-testid={testId}>
        {children}
      </Link>
    );
  }
  return (
    <Link to={dest.to} className={className} data-testid={testId}>
      {children}
    </Link>
  );
}
