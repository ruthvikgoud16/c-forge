import { useState } from "react";
import { Stage, Note } from "./shared";

type Kind = "preprocessor" | "function" | "declaration" | "statement" | "comment" | "return";
const PROGRAM: { text: string; kind: Kind; explain: string }[] = [
  { text: "#include <stdio.h>", kind: "preprocessor", explain: "Preprocessor directive: pulls in declarations for printf and scanf." },
  { text: "#define LIMIT 3", kind: "preprocessor", explain: "Macro: LIMIT is textually replaced by 3 before compilation." },
  { text: "", kind: "comment", explain: "Blank line — ignored by the compiler." },
  { text: "/* entry point */", kind: "comment", explain: "Comment: ignored by the compiler, written for humans." },
  { text: "int main(void) {", kind: "function", explain: "Function header: main returns int and takes no parameters. { opens the body." },
  { text: "    int i, sum = 0;", kind: "declaration", explain: "Declaration: two int variables; sum is initialised to 0." },
  { text: "    for (i = 1; i <= LIMIT; i++)", kind: "statement", explain: "Loop statement: runs its body for i = 1, 2, 3." },
  { text: "        sum += i;", kind: "statement", explain: "Expression statement: compound assignment adds i to sum." },
  { text: '    printf("%d\\n", sum);', kind: "statement", explain: "Function call statement: prints 6." },
  { text: "    return 0;", kind: "return", explain: "Return statement: ends main and reports success to the OS." },
  { text: "}", kind: "function", explain: "Closing brace ends the function body." },
];
const KINDS: { k: Kind; label: string; cls: string }[] = [
  { k: "preprocessor", label: "Preprocessor", cls: "bg-info/25" },
  { k: "function", label: "Function", cls: "bg-copper/30" },
  { k: "declaration", label: "Declarations", cls: "bg-gold/35" },
  { k: "statement", label: "Statements", cls: "bg-forest/30" },
  { k: "return", label: "Return", cls: "bg-ember/30" },
  { k: "comment", label: "Comments", cls: "bg-stone/50" },
];

export function SyntaxViz() {
  const [kind, setKind] = useState<Kind | null>(null);
  const [line, setLine] = useState<number | null>(null);
  const cls = (k: Kind) => KINDS.find((x) => x.k === k)!.cls;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Highlight program element">
        {KINDS.map((k) => (
          <button key={k.k} aria-pressed={kind === k.k} onClick={() => setKind(kind === k.k ? null : k.k)} className={`rounded-full border px-3 py-1 text-sm ${kind === k.k ? `${k.cls} border-foreground` : "border-border bg-card"}`}>{k.label}</button>
        ))}
        <button onClick={() => { setKind(null); setLine(null); }} className="rounded-full px-3 py-1 text-sm text-muted-foreground underline">Reset</button>
      </div>
      <Stage className="!bg-code !p-0">
        <ol className="py-3 font-mono text-[13px] leading-7 text-code-foreground">
          {PROGRAM.map((p, n) => (
            <li key={n}>
              <button onClick={() => setLine(n)} className={`block w-full px-4 text-left whitespace-pre ${kind === p.kind ? cls(p.kind) : ""} ${line === n ? "outline outline-2 outline-ember" : ""} hover:bg-code-foreground/5`}>
                <span className="mr-3 inline-block w-5 text-right text-code-comment/60">{n + 1}</span>{p.text || " "}
              </button>
            </li>
          ))}
        </ol>
      </Stage>
      <Note>{line !== null ? <><strong className="capitalize">{PROGRAM[line]!.kind}</strong> — {PROGRAM[line]!.explain}</> : "Select any line to identify it, or pick an element type to highlight every occurrence."}</Note>
    </div>
  );
}
