import Link from "next/link";

export function MindMap({
  title,
  children,
}: {
  title: string;
  children: Array<{ id?: string; title: string; href?: string; classification?: string }>;
}) {
  return (
    <section className="card mind-map" aria-label="Mind map">
      <p className="brand">Mind map</p>
      <h2 className="mind-map__root">{title}</h2>
      <ul className="mind-map__nodes">
        {children.map((child) => (
          <li key={child.id ?? child.title}>
            {child.href ? (
              <Link className="mind-map__node" href={child.href}>
                {child.title}
                {child.classification ? <span className="meta"> · {child.classification}</span> : null}
              </Link>
            ) : (
              <span className="mind-map__node">
                {child.title}
                {child.classification ? <span className="meta"> · {child.classification}</span> : null}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
