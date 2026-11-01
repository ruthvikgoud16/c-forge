import { NavBar, type NavItem } from "@/components/ui/nav";

const ITEMS: NavItem[] = [
  { href: "/learn", label: "Dashboard" },
  { href: "/learn/path", label: "Learning path" },
  { href: "/learn/diagnostic", label: "Diagnostic" },
  { href: "/learn#official-units", label: "Five official units" },
  { href: "/learn/foundation", label: "Foundation" },
  { href: "/learn/tools/binary", label: "Tools" },
  { href: "/learn/labs", label: "Labs" },
  { href: "/learn/papers", label: "Papers" },
];

export function AcademyNav({ roll, greeting }: { roll?: string; greeting?: string }) {
  return <NavBar label="Academy" items={ITEMS} meta={greeting ?? roll} />;
}
