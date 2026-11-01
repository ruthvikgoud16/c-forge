import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cx } from "@/lib/ui/tokens";

/** Wires label, hint and error to the control by id so it works in server components without useId. */
export function Field({
  id,
  label,
  hint,
  error,
  className,
  children,
}: {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cx("ui-field", className)}>
      <label className="ui-field__label" htmlFor={id}>
        {label}
      </label>
      {children}
      {hint ? (
        <p className="ui-field__hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="ui-field__error" id={`${id}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** aria-describedby for a control rendered inside <Field>. */
export function describedBy(id: string, { hint, error }: { hint?: unknown; error?: unknown }) {
  const ids = [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ");
  return ids || undefined;
}

export function Input({
  mono,
  invalid,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { mono?: boolean; invalid?: boolean }) {
  return (
    <input
      {...rest}
      aria-invalid={invalid || undefined}
      className={cx("ui-input", mono && "ui-input--mono", className)}
    />
  );
}

export function Select({
  invalid,
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select {...rest} aria-invalid={invalid || undefined} className={cx("ui-select", className)}>
      {children}
    </select>
  );
}

export function Textarea({
  mono,
  invalid,
  className,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { mono?: boolean; invalid?: boolean }) {
  return (
    <textarea
      {...rest}
      aria-invalid={invalid || undefined}
      className={cx("ui-textarea", mono && "ui-textarea--mono", className)}
    />
  );
}
