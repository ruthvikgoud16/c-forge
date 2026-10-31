import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const KEYWORDS = new Set("auto break case char const continue default do double else enum extern float for goto if int long register return short signed sizeof static struct switch typedef union unsigned void volatile while size_t".split(" "));

/** Tiny, dependency-free C highlighter for display purposes. */
export function highlightC(code: string): ReactNode[] {
  const re = /(\/\*[\s\S]*?\*\/|\/\/[^\n]*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(#\s*\w+[^\n]*)|\b(\d+(?:\.\d+)?[fFuUlL]*)\b|\b([A-Za-z_]\w*)\b/g;
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(code))) {
    if (m.index > last) out.push(code.slice(last, m.index));
    const [tok, comment, str, pre, num, ident] = m;
    if (comment) out.push(<span key={k++} className="text-code-comment italic">{tok}</span>);
    else if (str) out.push(<span key={k++} className="text-code-string">{tok}</span>);
    else if (pre) out.push(<span key={k++} className="text-code-type">{tok}</span>);
    else if (num) out.push(<span key={k++} className="text-code-number">{tok}</span>);
    else if (ident && KEYWORDS.has(ident)) out.push(<span key={k++} className="text-code-keyword">{tok}</span>);
    else out.push(tok);
    last = m.index + tok.length;
  }
  if (last < code.length) out.push(code.slice(last));
  return out;
}

export function CodeBlock({ code, output, title, className }: { code: string; output?: string | undefined; title?: string; className?: string }) {
  const lines = code.split("\n");
  return (
    <figure className={cn("overflow-hidden rounded-lg border border-border/40 bg-code text-code-foreground shadow-[var(--shadow-soft)]", className)}>
      <figcaption className="flex items-center justify-between border-b border-code-foreground/10 px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-code-comment">
        <span>{title ?? "C"}</span>
        <span aria-hidden className="flex gap-1.5">
          <i className="size-2 rounded-full bg-copper" />
          <i className="size-2 rounded-full bg-gold" />
          <i className="size-2 rounded-full bg-forest" />
        </span>
      </figcaption>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-6">
        <code>
          {lines.map((l, i) => (
            <Fragment key={i}>
              <span className="mr-4 inline-block w-6 select-none text-right text-code-comment/60">{i + 1}</span>
              {highlightC(l)}
              {"\n"}
            </Fragment>
          ))}
        </code>
      </pre>
      {output !== undefined && (
        <div className="border-t border-code-foreground/10 px-4 py-2 font-mono text-[13px]">
          <span className="mr-2 text-code-comment">output ›</span>
          <span className="text-code-string">{output}</span>
        </div>
      )}
    </figure>
  );
}
