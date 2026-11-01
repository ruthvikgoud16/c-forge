import type { ReactNode } from "react";
import { cx } from "@/lib/ui/tokens";

export type Tone = "neutral" | "accent" | "success" | "warning" | "danger" | "info";

export function Badge({ tone = "neutral", className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return <span className={cx("ui-badge", tone !== "neutral" && `ui-badge--${tone}`, className)}>{children}</span>;
}

/** Status is always conveyed by text; the dot is decorative. */
export function StatusIndicator({
  tone = "neutral",
  label,
  className,
}: {
  tone?: Exclude<Tone, "accent">;
  label: ReactNode;
  className?: string;
}) {
  return (
    <span className={cx("ui-status", tone !== "neutral" && `ui-status--${tone}`, className)}>
      <span className="ui-status__dot" aria-hidden="true" />
      {label}
    </span>
  );
}
