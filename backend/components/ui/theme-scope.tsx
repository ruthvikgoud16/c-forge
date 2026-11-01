import type { ElementType, ReactNode } from "react";
import { cx, type Theme } from "@/lib/ui/tokens";

export function ThemeScope({
  theme,
  as: Tag = "div",
  fill = false,
  className,
  children,
}: {
  theme: Theme;
  as?: ElementType;
  fill?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag data-theme={theme} className={cx("theme-scope", fill && "theme-scope--fill", className)}>
      {children}
    </Tag>
  );
}
