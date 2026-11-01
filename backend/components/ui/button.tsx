import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";
import { cx } from "@/lib/ui/tokens";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

type StyleProps = { variant?: ButtonVariant; size?: ButtonSize; block?: boolean };

export function buttonClass({ variant = "primary", size = "md", block = false }: StyleProps = {}, extra?: string) {
  return cx(
    "ui-button",
    variant !== "primary" && `ui-button--${variant}`,
    size !== "md" && `ui-button--${size}`,
    block && "ui-button--block",
    extra,
  );
}

export function Button({
  variant,
  size,
  block,
  loading = false,
  className,
  disabled,
  children,
  type = "button",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & StyleProps & { loading?: boolean }) {
  return (
    <button
      {...rest}
      type={type}
      className={buttonClass({ variant, size, block }, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading ? <span className="ui-spinner" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

export function ButtonLink({
  variant,
  size,
  block,
  className,
  ...rest
}: ComponentProps<typeof Link> & StyleProps) {
  return <Link {...rest} className={buttonClass({ variant, size, block }, className)} />;
}
