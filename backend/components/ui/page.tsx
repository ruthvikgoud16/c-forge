import type { ElementType, ReactNode } from "react";
import { cx } from "@/lib/ui/tokens";

export function PageContainer({
  as: Tag = "main",
  width = "md",
  className,
  children,
}: {
  as?: ElementType;
  width?: "sm" | "md" | "lg" | "xl";
  className?: string;
  children: ReactNode;
}) {
  return <Tag className={cx("ui-container", width !== "md" && `ui-container--${width}`, className)}>{children}</Tag>;
}

export function SectionHeader({
  title,
  eyebrow,
  description,
  actions,
  level = 2,
  id,
}: {
  title: ReactNode;
  eyebrow?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  level?: 1 | 2 | 3;
  id?: string;
}) {
  const Heading = `h${level}` as "h1" | "h2" | "h3";
  return (
    <header className={cx("ui-section-header", level === 1 && "ui-section-header--page")}>
      <div className="ui-section-header__text">
        {eyebrow ? <p className="ui-section-header__eyebrow">{eyebrow}</p> : null}
        <Heading className="ui-section-header__title" id={id}>
          {title}
        </Heading>
        {description ? <p className="ui-section-header__description">{description}</p> : null}
      </div>
      {actions ? <div className="ui-section-header__actions">{actions}</div> : null}
    </header>
  );
}
