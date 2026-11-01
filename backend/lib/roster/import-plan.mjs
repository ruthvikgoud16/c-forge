const PREFIX = "26EG104G";

export const COHORT_CAPACITY = 55;

export function officialRollNumbers() {
  return Array.from({ length: COHORT_CAPACITY }, (_, i) => `${PREFIX}${String(i + 1).padStart(2, "0")}`);
}

const OFFICIAL = new Set(officialRollNumbers());

function normalizeRoll(raw) {
  return String(raw ?? "").trim().toUpperCase();
}

function splitCsvLine(line) {
  const cells = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (ch === "," && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

/**
 * A file is applied only when it contains each official roll once, with a non-empty name.
 * Matching is by roll_number. Duplicate display names are allowed.
 */
export function planRosterImport(text) {
  const rejected = [];
  const byRoll = new Map();
  const lines = String(text).split(/\r?\n/);
  let start = 0;
  const header = splitCsvLine(lines[0] ?? "");
  if (header[0]?.toLowerCase() === "roll_number") start = 1;

  for (let i = start; i < lines.length; i += 1) {
    const raw = lines[i].trim();
    if (!raw) continue;
    const cells = splitCsvLine(raw);
    const line = i + 1;
    if (cells.length < 2) {
      rejected.push({ rollNumber: cells[0] ? normalizeRoll(cells[0]) : "", reason: "malformed_row", line });
      continue;
    }
    const rollNumber = normalizeRoll(cells[0]);
    const displayName = cells[1].trim();
    const source = (cells[2] ?? "").trim();
    if (!rollNumber || !OFFICIAL.has(rollNumber)) {
      rejected.push({ rollNumber, reason: "unknown_roll", line });
      continue;
    }
    if (!displayName) {
      rejected.push({ rollNumber, reason: "empty_name", line });
      continue;
    }
    if (byRoll.has(rollNumber)) {
      rejected.push({ rollNumber, reason: "duplicate_roll", line });
      byRoll.get(rollNumber).duplicate = true;
      continue;
    }
    byRoll.set(rollNumber, { rollNumber, displayName, source, line, duplicate: false });
  }

  for (const [rollNumber, row] of [...byRoll.entries()]) {
    if (row.duplicate) {
      rejected.push({ rollNumber, reason: "duplicate_roll", line: row.line });
      byRoll.delete(rollNumber);
    }
  }

  const missing = officialRollNumbers().filter((roll) => !byRoll.has(roll));
  const uniqueRollCount = byRoll.size;
  const valid = missing.length === 0 && rejected.length === 0 && uniqueRollCount === officialRollNumbers().length;
  const rows = valid
    ? officialRollNumbers().map((roll) => {
        const row = byRoll.get(roll);
        return { rollNumber: row.rollNumber, displayName: row.displayName, source: row.source };
      })
    : [];

  return { valid, rows, rejected, missing, uniqueRollCount };
}

async function relationExists(tx, name) {
  const found = await tx.unsafe(`SELECT to_regclass('public.${name}') AS rel`);
  return Boolean(found[0]?.rel);
}

async function snapshot(tx, name, query) {
  if (!(await relationExists(tx, name))) return null;
  return tx.unsafe(query);
}

function sameSnapshot(before, after) {
  return JSON.stringify(before) === JSON.stringify(after);
}

/**
 * Updates display_name on existing student_roster rows. Does not insert students,
 * invitations, or learning rows. Does not write when the plan is invalid.
 * Does not overwrite a name with an empty value.
 */
export async function applyRosterPlan(sql, plan) {
  if (!plan?.valid) {
    return {
      applied: false,
      updated: [],
      unchanged: [],
      missing: plan?.missing ?? [],
      rejected: plan?.rejected ?? [],
      activeStudents: null,
      studentsUnchanged: true,
      auditInserted: 0,
    };
  }

  return sql.begin(async (tx) => {
    await tx`SELECT set_config('cforge.faculty', '1', true)`;
    if (!(await relationExists(tx, "student_roster"))) {
      throw new Error("student_roster is missing");
    }
    const studentsBefore = await snapshot(
      tx,
      "students",
      "SELECT id::text, roll_identifier, password_hash, status FROM students ORDER BY roll_identifier",
    );
    const invitesBefore = await snapshot(
      tx,
      "invitations",
      "SELECT id::text, token_hash, consumed_by::text, consumed_at FROM invitations ORDER BY id",
    );
    const eventsBefore = await snapshot(
      tx,
      "learning_events",
      "SELECT id::text, student_id::text, topic_id, kind, correct FROM learning_events ORDER BY id",
    );
    const activeBefore = studentsBefore
      ? await tx.unsafe("SELECT count(*)::int AS n FROM students WHERE status = 'active'")
      : null;

    const updated = [];
    const unchanged = [];
    const missing = [];
    let auditInserted = 0;

    for (const row of plan.rows) {
      const name = row.displayName?.trim() ?? "";
      if (!name) continue;
      const existing = await tx`
        SELECT display_name FROM student_roster WHERE roll_number = ${row.rollNumber}
      `;
      if (existing.length === 0) {
        missing.push(row.rollNumber);
        continue;
      }
      const previous = existing[0].display_name;
      if (previous === name) {
        unchanged.push(row.rollNumber);
        continue;
      }
      const written = await tx`
        UPDATE student_roster
        SET display_name = ${name}, updated_at = now()
        WHERE roll_number = ${row.rollNumber}
          AND display_name IS DISTINCT FROM ${name}
          AND ${name} <> ''
        RETURNING roll_number
      `;
      if (written.length === 0) {
        unchanged.push(row.rollNumber);
        continue;
      }
      await tx`
        INSERT INTO roster_name_audit (roll_number, previous_name, new_name, actor)
        VALUES (${row.rollNumber}, ${previous}, ${name}, ${`roster-import:${row.source || "verified"}`})
      `;
      auditInserted += 1;
      updated.push({ rollNumber: row.rollNumber, previousName: previous, displayName: name });
    }

    const studentsAfter = await snapshot(
      tx,
      "students",
      "SELECT id::text, roll_identifier, password_hash, status FROM students ORDER BY roll_identifier",
    );
    const invitesAfter = await snapshot(
      tx,
      "invitations",
      "SELECT id::text, token_hash, consumed_by::text, consumed_at FROM invitations ORDER BY id",
    );
    const eventsAfter = await snapshot(
      tx,
      "learning_events",
      "SELECT id::text, student_id::text, topic_id, kind, correct FROM learning_events ORDER BY id",
    );
    const activeAfter = studentsBefore
      ? await tx.unsafe("SELECT count(*)::int AS n FROM students WHERE status = 'active'")
      : null;
    if (
      !sameSnapshot(studentsBefore, studentsAfter) ||
      !sameSnapshot(invitesBefore, invitesAfter) ||
      !sameSnapshot(eventsBefore, eventsAfter) ||
      (activeBefore && activeAfter && activeBefore[0].n !== activeAfter[0].n)
    ) {
      throw new Error("roster import touched identities, invitations, or learning history");
    }

    return {
      applied: true,
      updated,
      unchanged,
      missing,
      rejected: plan.rejected,
      activeStudents: activeAfter ? activeAfter[0].n : 0,
      studentsUnchanged: true,
      auditInserted,
    };
  });
}
