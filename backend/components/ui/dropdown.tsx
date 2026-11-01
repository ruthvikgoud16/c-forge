"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { buttonClass, type ButtonVariant } from "./button";
import { cx } from "@/lib/ui/tokens";

export type DropdownItem = { label: ReactNode; onSelect: () => void; disabled?: boolean };

/** Menu button pattern: Enter/Space/ArrowDown open, arrows move, Home/End jump, Escape closes and restores focus. */
export function Dropdown({
  label,
  items,
  align = "start",
  variant = "secondary",
}: {
  label: ReactNode;
  items: DropdownItem[];
  align?: "start" | "end";
  variant?: ButtonVariant;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const menuId = useId();

  const enabled = () => items.map((item, i) => (item.disabled ? -1 : i)).filter((i) => i >= 0);

  function focusItem(index: number) {
    itemRefs.current[index]?.focus();
  }

  function openMenu(focus: "first" | "last" = "first") {
    setOpen(true);
    requestAnimationFrame(() => {
      const list = enabled();
      if (list.length) focusItem(focus === "first" ? list[0] : list[list.length - 1]);
    });
  }

  function close(restore = true) {
    setOpen(false);
    if (restore) trigger.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (root.current && !root.current.contains(event.target as Node)) close(false);
    }
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  function onTriggerKey(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openMenu("first");
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      openMenu("last");
    }
  }

  function onMenuKey(event: KeyboardEvent<HTMLUListElement>) {
    const list = enabled();
    const current = itemRefs.current.findIndex((el) => el === document.activeElement);
    const pos = list.indexOf(current);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusItem(list[(pos + 1) % list.length]);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      focusItem(list[(pos - 1 + list.length) % list.length]);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusItem(list[0]);
    } else if (event.key === "End") {
      event.preventDefault();
      focusItem(list[list.length - 1]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "Tab") {
      close(false);
    }
  }

  return (
    <div className="ui-menu" ref={root}>
      <button
        ref={trigger}
        type="button"
        className={buttonClass({ variant })}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={onTriggerKey}
      >
        {label}
        <span aria-hidden="true">▾</span>
      </button>
      {open ? (
        <ul id={menuId} role="menu" className={cx("ui-menu__list", align === "end" && "ui-menu__list--end")} onKeyDown={onMenuKey}>
          {items.map((item, i) => (
            <li key={i} role="none">
              <button
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                type="button"
                role="menuitem"
                tabIndex={-1}
                className="ui-menu__item"
                aria-disabled={item.disabled || undefined}
                onClick={() => {
                  if (item.disabled) return;
                  item.onSelect();
                  close();
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
