import { ThemeScope } from "@/components/ui/theme-scope";

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeScope theme="code" fill>
      {children}
    </ThemeScope>
  );
}
