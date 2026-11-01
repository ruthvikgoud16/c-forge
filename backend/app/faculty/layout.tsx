import { ThemeScope } from "@/components/ui/theme-scope";

export default function FacultyLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeScope theme="staff" fill>
      {children}
    </ThemeScope>
  );
}
