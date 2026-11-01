import { Fragment, type ReactNode } from "react";

const KEYWORDS = new Set(
  "auto break case char const continue default do double else enum extern float for goto if int long register return short signed sizeof static struct switch typedef union unsigned void volatile while size_t".split(
    " ",
  ),
);

export function highlightC(code: string): ReactNode[] {
  const re =
    /(\/\*[\s\S]*?\*\/|\/\/[^\n]*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(#\s*\w+[^\n]*)|\b(\d+(?:\.\d+)?[fFuUlL]*)\b|\b([A-Za-z_]\w*)\b/g;
  const out: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = re.exec(code))) {
    if (match.index > last) out.push(code.slice(last, match.index));
    const [tok, comment, str, pre, num, ident] = match;
    if (comment) out.push(<span key={key++} className="em-cmt">{tok}</span>);
    else if (str) out.push(<span key={key++} className="em-str">{tok}</span>);
    else if (pre) out.push(<span key={key++} className="em-typ">{tok}</span>);
    else if (num) out.push(<span key={key++} className="em-num">{tok}</span>);
    else if (ident && KEYWORDS.has(ident)) out.push(<span key={key++} className="em-kw">{tok}</span>);
    else out.push(tok);
    last = match.index + tok.length;
  }
  if (last < code.length) out.push(code.slice(last));
  return out;
}

export function HighlightLines({ code }: { code: string }) {
  return (
    <pre className="em-code">
      <code>
        {code.split("\n").map((line, index) => (
          <Fragment key={index}>
            {highlightC(line)}
            {"\n"}
          </Fragment>
        ))}
      </code>
    </pre>
  );
}
