import { lazy, Suspense } from "react";
import { highlightC } from "@/components/common/CodeBlock";
import { useAppearance } from "@/components/common/AppearanceProvider";

const Monaco = lazy(async () => {
  const mod = await import("@monaco-editor/react");
  return { default: mod.default };
});

export function StudioEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { appearance } = useAppearance();
  return (
    <Suspense fallback={<pre className="p-4 font-mono text-[13px] text-code-foreground">{highlightC(value)}</pre>}>
      <div className="h-full min-h-72" data-testid="studio-editor">
        <Monaco
          height="100%"
          language="c"
          theme={appearance === "dark" ? "vs-dark" : "vs"}
          value={value}
          onChange={(next) => onChange(next ?? "")}
          loading={<pre className="p-4 font-mono text-[13px] text-code-foreground">{highlightC(value)}</pre>}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            scrollBeyondLastLine: false,
            padding: { top: 12 },
            automaticLayout: true,
          }}
        />
      </div>
    </Suspense>
  );
}
