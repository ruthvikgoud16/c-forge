import { Link } from "@tanstack/react-router";

const STEPS = [
  { to: "/learn/onboarding", label: "Start" },
  { to: "/learn/diagnostic", label: "Diagnostic" },
  { to: "/learn/units", label: "Units" },
  { to: "/learn/practice", label: "Practice" },
  { to: "/learn/revision", label: "Revision" },
  { to: "/learn/progress", label: "Progress" },
] as const;

export function StudentJourney({ current }: { current?: (typeof STEPS)[number]["to"] }) {
  return (
    <nav aria-label="Student journey" className="overflow-x-auto rounded-full glass-panel p-1">
      <ol className="flex min-w-max gap-1 text-sm">
        {STEPS.map((step) => (
          <li key={step.to}>
            <Link
              to={step.to}
              className="press block rounded-full px-3 py-1.5 text-muted-foreground hover:text-foreground"
              activeOptions={{ exact: true }}
              activeProps={{ className: "bg-copper !text-pearl shadow", "aria-current": "page" }}
              data-current={current === step.to || undefined}
            >
              {step.label}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
