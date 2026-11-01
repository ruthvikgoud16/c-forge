import { BlockDiagram } from "./block-diagram";

type Visual = Record<string, unknown>;

export function LessonVisuals({ visual }: { visual?: Visual }) {
  if (!visual?.type) return null;
  if (visual.type === "block-diagram") {
    return (
      <BlockDiagram
        nodes={visual.nodes as Array<{ id: string; label: string }>}
        edges={visual.edges as Array<{ from: string; to: string }>}
      />
    );
  }
  if (visual.type === "flowchart") {
    const symbols = visual.symbols as Array<{ id: string; kind: string; label: string }>;
    const edges = visual.edges as Array<{ from: string; to: string; label?: string }>;
    return (
      <section className="card">
        <p className="brand">Flowchart</p>
        <ol>
          {symbols.map((s) => (
            <li key={s.id}>
              <strong>{s.kind}</strong>: {s.label}
            </li>
          ))}
        </ol>
        <p className="meta">
          Arrows:{" "}
          {edges
            .map((e) => {
              const a = symbols.find((s) => s.id === e.from)?.label;
              const b = symbols.find((s) => s.id === e.to)?.label;
              return `${a} → ${b}${e.label ? ` (${e.label})` : ""}`;
            })
            .join(" · ")}
        </p>
      </section>
    );
  }
  if (visual.type === "memory") {
    const cells = visual.cells as Array<{ name: string; type: string; value: string }>;
    return (
      <section className="card">
        <p className="brand">Memory picture</p>
        <ul>
          {cells.map((c) => (
            <li key={c.name}>
              <code>{c.name}</code> ({c.type}) = {c.value}
            </li>
          ))}
        </ul>
      </section>
    );
  }
  if (visual.type === "io-table") {
    const rows = visual.rows as Array<{ type: string; printf: string; scanf: string }>;
    return (
      <section className="card">
        <p className="brand">Format table</p>
        <ul>
          {rows.map((r) => (
            <li key={r.type}>
              {r.type}: printf {r.printf} · scanf {r.scanf}
            </li>
          ))}
        </ul>
      </section>
    );
  }
  if (visual.type === "eval-steps") {
    const steps = visual.steps as string[];
    return (
      <section className="card">
        <p className="brand">Evaluation</p>
        <h3>{String(visual.title ?? "")}</h3>
        <ol>
          {steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </section>
    );
  }
  if (visual.type === "program-skeleton") {
    const rows = visual.rows as Array<{ part: string; role: string }>;
    return (
      <section className="card">
        <p className="brand">Program skeleton</p>
        <ol>
          {rows.map((r) => (
            <li key={r.part}>
              <code>{r.part}</code> — {r.role}
            </li>
          ))}
        </ol>
      </section>
    );
  }
  return null;
}
