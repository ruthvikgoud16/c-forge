"use client";

import { useMemo, useState } from "react";
import { VISUALIZER_IDS } from "@/lib/content/visualizer-ids";

function Box({ children }: { children: React.ReactNode }) {
  return <div className="card viz">{children}</div>;
}

export function BinaryVisualiser() {
  const [dec, setDec] = useState(13);
  const bits = useMemo(() => Math.max(0, Math.floor(dec)).toString(2), [dec]);
  const places = bits.split("").reverse().map((b, i) => ({ bit: b, weight: 2 ** i }));
  const [op, setOp] = useState({ a: 5, b: 3 });
  return (
    <Box>
      <h2>Binary visualiser</h2>
      <p className="meta">Place values double from the right. This does not run student C in the browser.</p>
      <label>Decimal</label>
      <input type="number" min={0} max={255} value={dec} onChange={(e) => setDec(Number(e.target.value))} />
      <p>
        Binary: <code>{bits}</code>
      </p>
      <ol>
        {places.map((p, i) => (
          <li key={i}>
            bit {p.bit} × {p.weight} = {Number(p.bit) * p.weight}
          </li>
        ))}
      </ol>
      <p>Sum of weights: {places.reduce((s, p) => s + Number(p.bit) * p.weight, 0)}</p>
      <h3>Bitwise and / or</h3>
      <div className="row">
        <input type="number" value={op.a} onChange={(e) => setOp({ ...op, a: Number(e.target.value) })} />
        <input type="number" value={op.b} onChange={(e) => setOp({ ...op, b: Number(e.target.value) })} />
      </div>
      <p>
        {op.a} & {op.b} = {op.a & op.b} ({(op.a & op.b).toString(2)}) · {op.a} | {op.b} = {op.a | op.b}
      </p>
    </Box>
  );
}

export function SyntaxExplorer() {
  const [text, setText] = useState("int sum = a + 2;");
  const kinds = [
    { re: /\b(int|return|if|else|while|for|switch|case|break|continue|void|char|float|double)\b/g, name: "keyword" },
    { re: /\b\d+\b/g, name: "literal" },
    { re: /[=+\-*/%&|!?:<>]+/g, name: "operator" },
    { re: /[{}();,]/g, name: "delimiter" },
  ];
  return (
    <Box>
      <h2>Syntax explorer</h2>
      <p className="meta">Keywords, operators, literals, and delimiters. Invalid names are explained, not compiled.</p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} />
      <ul>
        {kinds.map((k) => (
          <li key={k.name}>
            {k.name}: {(text.match(k.re) ?? []).join(" ") || "—"}
          </li>
        ))}
      </ul>
      <p>Valid: <code>count</code>. Invalid: <code>2nd</code> (starts with a digit), <code>int</code> as a name (keyword).</p>
      <p>Common compiler message: “undeclared identifier” usually means a missing declaration or a misspelt name.</p>
    </Box>
  );
}

const ALGO = [
  { text: "Set largest = a", vars: { largest: "a" } },
  { text: "If b > largest, largest = b", vars: { largest: "b if b>a else a" } },
  { text: "If c > largest, largest = c", vars: { largest: "max(a,b,c)" } },
  { text: "Print largest", vars: { largest: "max(a,b,c)" } },
];

export function AlgorithmVisualiser() {
  const [i, setI] = useState(0);
  const step = ALGO[i];
  return (
    <Box>
      <h2>Algorithm visualiser</h2>
      <p>Largest of three numbers. Deterministic walk — not a judge.</p>
      <ol>
        {ALGO.map((s, idx) => (
          <li key={s.text} className={idx === i ? "status-ok" : undefined}>
            {s.text}
          </li>
        ))}
      </ol>
      <p>Current: {step.text}</p>
      <p className="meta">Variables: largest → {step.vars.largest}</p>
      <button type="button" onClick={() => setI((n) => Math.max(0, n - 1))}>
        Back
      </button>
      <button type="button" onClick={() => setI((n) => Math.min(ALGO.length - 1, n + 1))}>
        Forward
      </button>
      <button type="button" className="secondary" onClick={() => setI(0)}>
        Reset
      </button>
    </Box>
  );
}

const FLOW = [
  { id: "start", kind: "term", label: "Start" },
  { id: "in", kind: "io", label: "Input n" },
  { id: "dec", kind: "dec", label: "n % 2 == 0 ?" },
  { id: "even", kind: "io", label: "Print EVEN" },
  { id: "odd", kind: "io", label: "Print ODD" },
  { id: "stop", kind: "term", label: "Stop" },
];

export function FlowchartViewer() {
  const [n, setN] = useState(7);
  const even = n % 2 === 0;
  return (
    <Box>
      <h2>Flowchart viewer</h2>
      <p className="meta">Oval = start/stop. Parallelogram = I/O. Diamond = decision. Rectangle = process.</p>
      <label>n</label>
      <input type="number" value={n} onChange={(e) => setN(Number(e.target.value))} />
      <ul className="flow">
        {FLOW.map((node) => (
          <li key={node.id} className={`flow-${node.kind} ${((node.id === "even" && even) || (node.id === "odd" && !even) || node.id === "dec" || node.id === "start" || node.id === "in" || node.id === "stop") ? "active-flow" : ""}`}>
            [{node.kind}] {node.label}
          </li>
        ))}
      </ul>
      <p>Path taken: Start → Input → Decision → {even ? "EVEN" : "ODD"} → Stop. Matches `if (n % 2 == 0)`.</p>
    </Box>
  );
}

export function ControlFlowVisualiser() {
  const [kind, setKind] = useState<"if" | "while" | "for">("if");
  const [x, setX] = useState(4);
  const log =
    kind === "if"
      ? x > 0
        ? "if branch: x is positive"
        : "else branch: x is not positive"
      : kind === "while"
        ? `while (i < ${x}) runs ${Math.max(0, x)} times if i starts at 0 and i++`
        : `for (i = 0; i < ${x}; i++) also runs ${Math.max(0, x)} times`;
  return (
    <Box>
      <h2>Control-flow visualiser</h2>
      <div className="row">
        <button type="button" onClick={() => setKind("if")}>
          if
        </button>
        <button type="button" onClick={() => setKind("while")}>
          while
        </button>
        <button type="button" onClick={() => setKind("for")}>
          for
        </button>
      </div>
      <label>x / limit</label>
      <input type="number" value={x} onChange={(e) => setX(Number(e.target.value))} />
      <p>{log}</p>
      <p className="meta">break leaves the loop. continue skips the rest of this iteration. goto jumps to a label — use it only when teaching the syllabus, not as a habit.</p>
    </Box>
  );
}

export function ArrayStringVisualiser() {
  const cells = ["C", "a", "t", "\\0"];
  return (
    <Box>
      <h2>Array and string visualiser</h2>
      <p>Index is the offset from the first element. A C string ends with the null character.</p>
      <table>
        <thead>
          <tr>
            <th>index</th>
            {cells.map((_, i) => (
              <th key={i}>{i}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>value</td>
            {cells.map((c, i) => (
              <td key={i}>
                <code>{c}</code>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <p>strlen counts until \\0 and does not include it. Writing past index 3 here would be a buffer overrun — do not do that.</p>
    </Box>
  );
}

export function RecursionVisualiser() {
  const [n, setN] = useState(3);
  const frames = useMemo(() => {
    const out: string[] = [];
    function fact(k: number, depth: number): number {
      out.push(`enter fact(${k}) depth ${depth}`);
      if (k <= 1) {
        out.push(`base fact(${k}) = 1`);
        return 1;
      }
      const r = k * fact(k - 1, depth + 1);
      out.push(`leave fact(${k}) = ${r}`);
      return r;
    }
    fact(n, 1);
    return out;
  }, [n]);
  return (
    <Box>
      <h2>Function and recursion visualiser</h2>
      <label>n for factorial (1–6)</label>
      <input type="number" min={1} max={6} value={n} onChange={(e) => setN(Math.min(6, Math.max(1, Number(e.target.value))))} />
      <ol>
        {frames.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ol>
      <p className="meta">Each call has its own n. The base case stops the stack from growing forever.</p>
    </Box>
  );
}

export function SearchSortVisualiser() {
  const data = [4, 1, 3, 2];
  const [step, setStep] = useState(0);
  const bubble = [
    [4, 1, 3, 2],
    [1, 4, 3, 2],
    [1, 3, 4, 2],
    [1, 3, 2, 4],
    [1, 2, 3, 4],
  ];
  const cur = bubble[Math.min(step, bubble.length - 1)];
  return (
    <Box>
      <h2>Searching and sorting visualiser</h2>
      <p>Bubble sort on [4, 1, 3, 2]. Adjacent swap when out of order. Linear search would scan left to right; binary search needs a sorted array first.</p>
      <p>
        {cur.map((n, i) => (
          <span key={i} className="cell">
            {n}
          </span>
        ))}
      </p>
      <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))}>
        Back
      </button>
      <button type="button" onClick={() => setStep((s) => Math.min(bubble.length - 1, s + 1))}>
        Forward
      </button>
      <button type="button" className="secondary" onClick={() => setStep(0)}>
        Reset
      </button>
      <p className="meta">Start array was {data.join(", ")}. This stepper is a teaching model, not a complexity proof.</p>
    </Box>
  );
}

const MAP = {
  binary: BinaryVisualiser,
  syntax: SyntaxExplorer,
  algorithm: AlgorithmVisualiser,
  flowchart: FlowchartViewer,
  "control-flow": ControlFlowVisualiser,
  "array-string": ArrayStringVisualiser,
  recursion: RecursionVisualiser,
  "search-sort": SearchSortVisualiser,
} as const;

export function VisualTool({ id }: { id: string }) {
  const Cmp = MAP[id as keyof typeof MAP];
  if (!Cmp) return <p>Unknown tool. Available: {Object.keys(MAP).join(", ")}</p>;
  return <Cmp />;
}

export { VISUALIZER_IDS };
