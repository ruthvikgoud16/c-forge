import type { ElementType, HTMLAttributes } from "react";
import { cx } from "@/lib/ui/tokens";

export type CardVariant = "solid" | "glass" | "raised" | "sunken";

export function Card({
  as: Tag = "section",
  variant = "solid",
  padding = "md",
  interactive = false,
  className,
  ...rest
}: HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  variant?: CardVariant;
  padding?: "sm" | "md" | "lg";
  interactive?: boolean;
}) {
  return (
    <Tag
      {...rest}
      className={cx(
        "ui-card",
        variant !== "solid" && `ui-card--${variant}`,
        padding !== "md" && `ui-card--pad-${padding}`,
        interactive && "ui-card--interactive",
        className,
      )}
    />
  );
}

/** Frosted surface. Blur strength comes from the active theme (none in the coding theme). */
export function GlassPanel(props: Omit<Parameters<typeof Card>[0], "variant">) {
  return <Card {...props} variant="glass" />;
}
