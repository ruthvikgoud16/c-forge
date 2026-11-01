"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export type NavItem = { href: string; label: ReactNode };

function isCurrent(pathname: string, href: string) {
  const path = href.split("#")[0] || "/";
  if (href.includes("#")) return false;
  return pathname === path;
}

export function NavBar({ label, items, meta }: { label: string; items: NavItem[]; meta?: ReactNode }) {
  const pathname = usePathname() ?? "";
  return (
    <nav className="ui-nav" aria-label={label}>
      <ul className="ui-nav__links">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="ui-nav__link"
              aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
      {meta ? <span className="ui-nav__meta">{meta}</span> : null}
    </nav>
  );
}
