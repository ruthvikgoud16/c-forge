const DIRECTIONS = [
  {
    id: "forge",
    letter: "A",
    name: "Forge Editorial",
    personality: "Deep ink, parchment, copper and forest. Confident and editorial.",
  },
  {
    id: "colorfield",
    letter: "B",
    name: "Colorfield Academy",
    personality: "Teal, warm yellow and muted coral on ink. Energetic and grouped by colour.",
  },
  {
    id: "campus",
    letter: "C",
    name: "Contemporary Campus",
    personality: "Plum, terracotta and warm paper. Thoughtful and academic.",
  },
] as const;

function Scenes() {
  return (
    <>
      <section className="lab-scene" data-surface="login">
        <p className="lab-brand">CForge</p>
        <h3>Log in</h3>
        <label>Roll identifier</label>
        <div className="lab-field" />
        <label>Password</label>
        <div className="lab-field" />
        <button type="button">Log in</button>
      </section>

      <section className="lab-scene" data-surface="student">
        <p className="lab-nav">
          <span>Dashboard</span>
          <span>Path</span>
          <span>Practice</span>
        </p>
        <p className="lab-kicker">Student</p>
        <h3>Welcome, 26EG104G01</h3>
        <div className="lab-card">
          <strong>Continue learning</strong>
          <p>Block diagram of a computer, and the binary system.</p>
          <button type="button">Continue</button>
        </div>
        <p className="lab-note">Unit 1 · 2 of 8 opened · opened is not mastered</p>
      </section>

      <section className="lab-scene" data-surface="lesson">
        <p className="lab-kicker">Lesson</p>
        <h3>The computer, its parts, and binary</h3>
        <p>
          A block diagram has input, memory, a control unit, an ALU, and output. Binary place values
          double from the right.
        </p>
        <pre>{`13 = 1101\n8 + 4 + 1`}</pre>
      </section>

      <section className="lab-scene" data-surface="units">
        <p className="lab-kicker">Units</p>
        <div className="lab-units">
          <article>
            <span>01</span>
            <strong>Preliminaries</strong>
          </article>
          <article>
            <span>02</span>
            <strong>Decisions</strong>
          </article>
          <article>
            <span>03</span>
            <strong>Arrays</strong>
          </article>
        </div>
        <div className="lab-resources">
          <span>Notes</span>
          <span>Mind map</span>
          <span>Flashcards</span>
          <span>Assessment</span>
        </div>
      </section>

      <section className="lab-scene" data-surface="map">
        <p className="lab-kicker">Mind map</p>
        <div className="lab-map">
          <strong>Computer basics</strong>
          <span>Components</span>
          <span>Binary</span>
          <span>Algorithms</span>
        </div>
        <div className="lab-viz">
          <p className="lab-kicker">Binary visualiser</p>
          <p>
            Decimal <b>13</b> · bits <b>1101</b>
          </p>
        </div>
      </section>

      <section className="lab-scene" data-surface="faculty">
        <p className="lab-kicker">Faculty</p>
        <h3>Cohort</h3>
        <ul>
          <li>
            <span>26EG104G01</span>
            <span>Active</span>
          </li>
          <li>
            <span>26EG104G02</span>
            <span>Invited</span>
          </li>
          <li>
            <span>26EG104G03</span>
            <span>Active</span>
          </li>
        </ul>
      </section>

      <section className="lab-scene" data-surface="code">
        <p className="lab-kicker">Studio</p>
        <h3>Hello, CForge!</h3>
        <pre>{`#include <stdio.h>\nint main(void) {\n  puts("Hello, CForge!");\n}`}</pre>
        <p className="lab-actions">
          <button type="button">Run</button>
          <button type="button" className="lab-quiet">
            Submit
          </button>
        </p>
      </section>
    </>
  );
}

export function IdentityLab() {
  return (
    <section className="identity-lab" aria-label="Visual identity exploration">
      <header className="identity-lab__intro">
        <p>Design lab</p>
        <h2>Three visual identities</h2>
        <p>Same sample screens. Production themes above are unchanged.</p>
      </header>
      <div className="identity-lab__compare">
        {DIRECTIONS.map((direction) => (
          <article key={direction.id} className="lab-board" data-lab={direction.id}>
            <header className="lab-mast">
              <p>
                Direction {direction.letter}
              </p>
              <h2>{direction.name}</h2>
              <p>{direction.personality}</p>
            </header>
            <div className="lab-desktop">
              <Scenes />
            </div>
            <p className="lab-frame-label">Mobile</p>
            <div className="lab-mobile">
              <Scenes />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
