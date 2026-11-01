"use client";

import { useMemo, useState } from "react";

const TOKEN_KEY = "cforge_faculty_token";

type Overview = {
  cohortCapacity: number;
  approvedRoster: number;
  namedRoster: number;
  unnamedRoster: number;
  activeStudents: number;
  pendingInvitations: number;
  availableSeats: number;
  unitProgress: Array<{
    unitId: string;
    title: string;
    teachingTopics: number;
    studentsOpened: number;
    studentsPractised: number;
    studentsMastered: number;
  }>;
  assessments: {
    attemptCount: number;
    uniqueStudents: number;
    distributionSuppressed: boolean;
    reason?: string;
    buckets: Array<{ label: string; count: number }>;
  };
  revisitTopics: Array<{ topicId: string; studentCount: number | null; suppressed: boolean }>;
  engagement: {
    eventCount: number;
    uniqueStudentsWithEvents: number;
    lessonOpenedCount: number;
    practiceEventCount: number;
  };
  students: Array<{ rollNumber: string; displayName: string | null; accountStatus: string }>;
  invitations: { pending: number; consumed: number };
  notes: string[];
};

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export function FacultyDashboard() {
  const [token, setToken] = useState(() =>
    typeof window === "undefined" ? "" : sessionStorage.getItem(TOKEN_KEY) ?? "",
  );
  const [draft, setDraft] = useState(token);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [minted, setMinted] = useState("");
  const [inviteRoll, setInviteRoll] = useState("");
  const [nameEdits, setNameEdits] = useState<Record<string, string>>({});

  async function load(nextToken = token) {
    setError("");
    const response = await fetch("/api/v1/faculty/overview", { headers: authHeaders(nextToken) });
    if (response.status === 401) {
      setOverview(null);
      setError("Faculty token rejected.");
      return;
    }
    if (!response.ok) {
      setError("Overview failed.");
      return;
    }
    setOverview((await response.json()) as Overview);
  }

  function saveToken() {
    const next = draft.trim();
    sessionStorage.setItem(TOKEN_KEY, next);
    setToken(next);
    void load(next);
  }

  const rows = useMemo(() => {
    if (!overview) return [];
    const q = query.trim().toLowerCase();
    return overview.students.filter((row) => {
      if (!q) return true;
      return row.rollNumber.toLowerCase().includes(q) || (row.displayName ?? "").toLowerCase().includes(q);
    });
  }, [overview, query]);

  async function saveName(rollNumber: string) {
    const displayName = (nameEdits[rollNumber] ?? "").trim();
    if (!displayName) return;
    const response = await fetch("/api/v1/faculty/roster", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ updates: [{ rollNumber, displayName }] }),
    });
    if (!response.ok) {
      setError("Name update failed.");
      return;
    }
    await load();
  }

  async function mint() {
    setMinted("");
    const response = await fetch("/api/v1/faculty/invitations", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ ttlHours: 168, rollNumber: inviteRoll }),
    });
    if (!response.ok) {
      setError("Invitation mint failed.");
      return;
    }
    const body = (await response.json()) as { token: string };
    setMinted(body.token);
    await load();
  }

  async function applyCsv() {
    const response = await fetch("/api/v1/faculty/roster/import", {
      method: "POST",
      headers: authHeaders(token),
    });
    if (response.status === 404) {
      setError("Verified roster CSV is not on this machine.");
      return;
    }
    if (!response.ok) {
      setError("CSV import failed.");
      return;
    }
    await load();
  }

  return (
    <main className="shell">
      <p className="brand">Faculty</p>
      <h1>Cohort dashboard</h1>
      <p className="meta">
        Bearer faculty token only. Students cannot use this page to see peer records. Capacity is
        55 official rolls. Remaining seats are capacity, not invented people.
      </p>

      <section className="card">
        <label htmlFor="faculty-token">Faculty token</label>
        <input
          id="faculty-token"
          type="password"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          autoComplete="off"
        />
        <button type="button" onClick={saveToken}>
          Open dashboard
        </button>
        {error ? <p className="status-bad">{error}</p> : null}
      </section>

      {!overview ? (
        <section className="card">
          <p className="meta">No faculty data loaded. Enter a valid token. Empty is honest.</p>
        </section>
      ) : (
        <>
          <section className="card">
            <h2>Overview</h2>
            <div className="stat-grid">
              <p><strong>{overview.approvedRoster}</strong><br />Approved rolls</p>
              <p><strong>{overview.activeStudents}</strong><br />Active accounts</p>
              <p><strong>{overview.pendingInvitations}</strong><br />Pending invitations</p>
              <p><strong>{overview.cohortCapacity}</strong><br />Capacity</p>
              <p><strong>{overview.availableSeats}</strong><br />Available seats</p>
              <p><strong>{overview.namedRoster}</strong><br />Named roster</p>
              <p><strong>{overview.unnamedRoster}</strong><br />Unnamed rolls</p>
            </div>
            <ul>
              {overview.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </section>

          <section className="card">
            <h2>Student management</h2>
            <p className="meta">
              Roll number is the identity. Names can change. Invitations are not assigned to a roll
              until a student accepts.
            </p>
            <label htmlFor="roster-search">Search roll or name</label>
            <input id="roster-search" value={query} onChange={(event) => setQuery(event.target.value)} />
            <button type="button" className="secondary" onClick={applyCsv}>
              Apply verified CSV names
            </button>
            <label htmlFor="invite-roll">Invite approved roll</label>
            <input
              id="invite-roll"
              value={inviteRoll}
              onChange={(event) => setInviteRoll(event.target.value)}
              placeholder="26EG104G01"
            />
            <button type="button" onClick={mint}>
              Mint invitation
            </button>
            {minted ? <p className="mono">Show once: {minted}</p> : null}
            <p className="meta">
              Invitations pending {overview.invitations.pending}, consumed {overview.invitations.consumed}.
            </p>
            {rows.length === 0 ? (
              <p className="meta">No roster rows match this search.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="faculty-table">
                  <thead>
                    <tr>
                      <th>Roll</th>
                      <th>Display name</th>
                      <th>Account</th>
                      <th>Update name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.rollNumber}>
                        <td className="mono">{row.rollNumber}</td>
                        <td>{row.displayName ?? "—"}</td>
                        <td>{row.accountStatus}</td>
                        <td>
                          <input
                            aria-label={`Name for ${row.rollNumber}`}
                            value={nameEdits[row.rollNumber] ?? row.displayName ?? ""}
                            onChange={(event) =>
                              setNameEdits((current) => ({ ...current, [row.rollNumber]: event.target.value }))
                            }
                          />
                          <button type="button" className="secondary" onClick={() => void saveName(row.rollNumber)}>
                            Save
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="card">
            <h2>Academic overview</h2>
            {overview.engagement.eventCount === 0 ? (
              <p className="meta">No recorded learning events yet. Nothing is invented.</p>
            ) : (
              <p className="meta">
                {overview.engagement.eventCount} events from {overview.engagement.uniqueStudentsWithEvents} students.
                Opened {overview.engagement.lessonOpenedCount}. Practice events {overview.engagement.practiceEventCount}.
              </p>
            )}
            {overview.unitProgress.map((unit) => (
              <div key={unit.unitId}>
                <h3>{unit.title}</h3>
                <p className="meta">
                  Teaching topics {unit.teachingTopics}. Students opened {unit.studentsOpened}, practised{" "}
                  {unit.studentsPractised}, mastered {unit.studentsMastered}.
                </p>
                <div className="meter" aria-hidden="true">
                  <span
                    style={{
                      width: `${overview.activeStudents > 0 ? Math.round((unit.studentsOpened / overview.activeStudents) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            <h3>Assessments</h3>
            {overview.assessments.attemptCount === 0 ? (
              <p className="meta">No practice assessment attempts yet.</p>
            ) : overview.assessments.distributionSuppressed ? (
              <p className="meta">
                {overview.assessments.attemptCount} attempts. {overview.assessments.reason}
              </p>
            ) : (
              <ul>
                {overview.assessments.buckets.map((bucket) => (
                  <li key={bucket.label}>
                    {bucket.label}: {bucket.count}
                  </li>
                ))}
              </ul>
            )}
            <h3>Topics to revisit</h3>
            {overview.revisitTopics.length === 0 ? (
              <p className="meta">No recorded revision signals.</p>
            ) : (
              <ul>
                {overview.revisitTopics.map((topic) => (
                  <li key={topic.topicId}>
                    {topic.topicId}
                    {topic.suppressed ? " (n < 3)" : ` · ${topic.studentCount} students`}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}
