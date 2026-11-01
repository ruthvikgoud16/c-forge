"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

/**
 * Native <dialog> with showModal(): the browser provides the focus trap, inert background,
 * Escape-to-close and top-layer stacking. Focus returns to the opener on close.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<Element | null>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      opener.current = document.activeElement;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="ui-dialog"
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onClose={() => {
        if (opener.current instanceof HTMLElement) opener.current.focus();
        if (open) onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <div className="ui-dialog__header">
        <h2 className="ui-dialog__title" id={titleId}>
          {title}
        </h2>
        {description ? (
          <p className="ui-dialog__description" id={descId}>
            {description}
          </p>
        ) : null}
      </div>
      {children ? <div className="ui-dialog__body">{children}</div> : null}
      {footer ? <div className="ui-dialog__footer">{footer}</div> : null}
    </dialog>
  );
}
