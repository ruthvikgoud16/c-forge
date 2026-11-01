import type { Metadata } from "next";
import Link from "next/link";
import { HighlightLines } from "@/components/public/highlight-c";
import { PublicFrame } from "@/components/public/public-frame";
import { VISUALIZER_IDS } from "@/lib/content/visualizer-ids";
import { allPackages } from "@/lib/content/registry";
import { officialUnits } from "@/lib/curriculum/catalog";

export const metadata: Metadata = {
  title: "CForge — Learn the logic. Forge the skill.",
  description:
    "A structured C programming academy for engineering students: five units, visual explanations, practice and assessments.",
};

const HERO = `int binary_search(int a[], int n, int key) {
    int lo = 0, hi = n - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] == key) return mid;
        if (a[mid] < key) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;
}`;

const TOOLS: Record<string, { name: string; blurb: string; glyph: string }> = {
  syntax: { name: "Syntax Explorer", blurb: "Identify the parts of a C program.", glyph: "{ }" },
  binary: { name: "Binary Lab", blurb: "Convert numbers and flip individual bits.", glyph: "01" },
  algorithm: { name: "Algorithm Stepper", blurb: "Step through an algorithm and watch its variables.", glyph: "→" },
  flowchart: { name: "Flowchart Tracer", blurb: "Trace an execution path through flowchart symbols.", glyph: "◇" },
  "control-flow": { name: "Control-flow Explorer", blurb: "Run if/else and loops line by line.", glyph: "↻" },
  "array-string": { name: "Array & String Inspector", blurb: "See indexes, values and string operations.", glyph: "[ ]" },
  recursion: { name: "Recursion Stack", blurb: "Watch calls push and returns pop.", glyph: "≡" },
  "search-sort": { name: "Search & Sort Lab", blurb: "Step through searches and sorting algorithms.", glyph: "⇅" },
};

const CELLS = [3, 8, 12, 17, 21, 26, 34];

export default function HomePage() {
  const units = officialUnits();
  const packages = allPackages().length;

  return (
    <PublicFrame>
      <section className="em-hero em-wrap">
        <div>
          <p className="em-eyebrow">C programming academy · engineering cohort</p>
          <h1 className="em-display">
            Learn the logic.
            <br />
            <em className="em-copper">Forge</em> the skill.
          </h1>
          <p className="em-lead em-muted">
            CForge is a structured C programming academy built to help engineering students understand
            programming through concepts, visual explanations, hands-on practice and assessments.
          </p>
          <div className="em-actions">
            <Link className="em-btn em-btn-hero" href="/login">
              Student Login
            </Link>
            <a className="em-btn em-btn-quiet" href="#approach">
              Explore the Learning Experience
            </a>
          </div>
          <dl className="em-stats">
            <div>
              <dt className="em-display">{units.length}</dt>
              <dd>official units</dd>
            </div>
            <div>
              <dt className="em-display">{packages}</dt>
              <dd>teaching packages</dd>
            </div>
            <div>
              <dt className="em-display">{VISUALIZER_IDS.length}</dt>
              <dd>visualisers</dd>
            </div>
          </dl>
        </div>
        <div>
          <p className="em-eyebrow">unit-5 / searching.c · illustration</p>
          <HighlightLines code={HERO} />
          <div className="em-search">
            <p className="em-eyebrow">array a[ ] · key = 21</p>
            <div className="em-cells">
              {CELLS.map((value, index) => (
                <div key={value}>
                  <div className={index === 4 ? "em-cell em-cell-mid" : index < 4 ? "em-cell em-cell-skip" : "em-cell"}>
                    {value}
                  </div>
                  <div className="em-meta">{index === 4 ? "mid" : index}</div>
                </div>
              ))}
            </div>
            <p className="em-meta">lo=4 · hi=6 · 10101₂ = 21</p>
          </div>
        </div>
      </section>

      <section id="approach" className="em-ink">
        <div className="em-steps em-wrap">
          <div>
            <p className="em-eyebrow">What is CForge?</p>
            <h2 className="em-display" style={{ fontSize: "2.4rem", margin: "0.6rem 0 0" }}>
              Concept first. Then see it. Then build it.
            </h2>
          </div>
          <ol>
            {[
              ["01", "Read the concept", "Lessons, notes and compact one-shot revision for every topic."],
              ["02", "Visualise it", "Mind maps and interactive tools make invisible state visible."],
              ["03", "Practise with purpose", "Guided practice, flashcards and coding exercises."],
              ["04", "Check understanding", "Topic and unit assessments, with progress you can act on."],
            ].map(([n, title, body]) => (
              <li key={n}>
                <span className="em-meta">{n}</span>
                <h3 className="em-display" style={{ fontSize: "1.25rem", margin: "0.25rem 0" }}>
                  {title}
                </h3>
                <p className="em-muted">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="curriculum" className="em-units em-wrap">
        <p className="em-eyebrow">Learn systematically</p>
        <h2 className="em-display" style={{ fontSize: "2.4rem", maxWidth: "36rem" }}>
          Five official syllabus units, one connected path.
        </h2>
        <div>
          {units.map((unit) => (
            <div className="em-unit-row" key={unit.id}>
              <span className="em-unit-no em-display">0{unit.ordinal ?? ""}</span>
              <h3 className="em-display" style={{ fontSize: "1.25rem", margin: 0 }}>
                {unit.title}
              </h3>
              <p className="em-muted">{unit.overview?.teaches ?? unit.sourceLabel}</p>
            </div>
          ))}
        </div>
        <p className="em-muted">Teaching packages currently published: {packages}. Counts come from the catalog, not a demo roster.</p>
      </section>

      <section id="visualise" className="em-tools">
        <div className="em-wrap" style={{ padding: "5rem 0" }}>
          <p className="em-eyebrow">Visualise concepts</p>
          <h2 className="em-display" style={{ fontSize: "2.4rem", maxWidth: "40rem" }}>
            Eight interactive visualisers and a mind map for every unit and topic.
          </h2>
          <div className="em-tool-grid" style={{ marginTop: "2rem" }}>
            {VISUALIZER_IDS.map((id) => (
              <div className="em-tool" key={id}>
                <span className="em-copper">{TOOLS[id]?.glyph}</span>
                <h3 style={{ margin: "0.4rem 0 0" }}>{TOOLS[id]?.name ?? id}</h3>
                <p className="em-muted">{TOOLS[id]?.blurb}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="em-feature-grid em-wrap" style={{ padding: "5rem 0" }}>
        {[
          ["Practise with purpose", "Guided practice in every lesson, flashcard decks per topic, and a focused C coding studio with run and submit feedback."],
          ["Track your progress", "See what you've demonstrated, mastered and what needs more practice — and what to revise next."],
          ["Built for engineering students", "An invitation-based cohort: your faculty adds you to the roster, you set your own password, and learning starts."],
        ].map(([title, body]) => (
          <div key={title}>
            <div className="em-rule" />
            <h3 className="em-display" style={{ fontSize: "1.5rem", margin: 0 }}>
              {title}
            </h3>
            <p className="em-muted">{body}</p>
          </div>
        ))}
      </section>

      <section className="em-ink">
        <div className="em-wrap" style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", alignItems: "center", justifyContent: "space-between", padding: "4rem 0" }}>
          <h2 className="em-display" style={{ fontSize: "2.4rem", margin: 0 }}>
            Ready to forge your logic?
          </h2>
          <Link className="em-btn em-btn-hero" href="/login">
            Student Login
          </Link>
        </div>
      </section>
    </PublicFrame>
  );
}
