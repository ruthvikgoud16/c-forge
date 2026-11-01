import { Moon, Sun } from "lucide-react";
import { useAppearance } from "@/components/common/AppearanceProvider";
import { cn } from "@/lib/utils";

export function AppearanceControls() {
  const { appearance, setAppearance } = useAppearance();
  return (
    <div className="grid gap-3 sm:grid-cols-2" data-testid="appearance-controls">
      <button
        type="button"
        onClick={() => setAppearance("light")}
        className={cn("press glass-panel rounded-[1.5rem] p-5 text-left", appearance === "light" && "ring-2 ring-copper")}
        aria-pressed={appearance === "light"}
        data-testid="appearance-light"
      >
        <Sun className="size-5 text-copper" />
        <p className="mt-3 font-display text-xl">Light</p>
        <p className="mt-1 text-sm text-muted-foreground">Warm glass panels and copper-to-ember accents.</p>
      </button>
      <button
        type="button"
        onClick={() => setAppearance("dark")}
        className={cn("press glass-panel rounded-[1.5rem] p-5 text-left", appearance === "dark" && "ring-2 ring-copper")}
        aria-pressed={appearance === "dark"}
        data-testid="appearance-dark"
      >
        <Moon className="size-5 text-ember" />
        <p className="mt-3 font-display text-xl">Dark</p>
        <p className="mt-1 text-sm text-muted-foreground">The same editorial glass system, dimmed for night use.</p>
      </button>
    </div>
  );
}
