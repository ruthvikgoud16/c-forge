export function BlockDiagram({
  nodes,
  edges,
}: {
  nodes: Array<{ id: string; label: string }>;
  edges: Array<{ from: string; to: string }>;
}) {
  return (
    <div className="card" style={{ overflowX: "auto" }}>
      <p className="brand">Block diagram</p>
      <div className="row">
        {nodes.map((node) => (
          <div key={node.id} className="card grow" style={{ margin: 0, textAlign: "center" }}>
            <strong>{node.label}</strong>
          </div>
        ))}
      </div>
      <p className="meta">
        Flows:{" "}
        {edges.map((e) => `${nodes.find((n) => n.id === e.from)?.label} → ${nodes.find((n) => n.id === e.to)?.label}`).join(" · ")}
      </p>
    </div>
  );
}
