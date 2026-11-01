import type { ReactNode } from "react";

/** Reserves space with fixed-height skeleton lines so content does not shift when it arrives. */
export function LoadingState({ label = "Loading", lines = 3 }: { label?: string; lines?: number }) {
  return (
    <div className="ui-state" role="status" aria-live="polite">
      <span className="ui-visually-hidden">{label}</span>
      <div style={{ width: "100%" }} aria-hidden="true">
        {Array.from({ length: lines }, (_, i) => (
          <span key={i} className="ui-skeleton" style={{ width: `${i === lines - 1 ? 60 : 100}%` }} />
        ))}
      </div>
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", children, action }: { title?: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="ui-state ui-state--error" role="alert">
      <p className="ui-state__title">{title}</p>
      {children ? <p className="ui-state__body">{children}</p> : null}
      {action}
    </div>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="ui-state">
      <p className="ui-state__title">{title}</p>
      {children ? <p className="ui-state__body">{children}</p> : null}
      {action}
    </div>
  );
}
