-- Approved 51-student roster. Does not activate accounts. Does not invent names.

CREATE TABLE IF NOT EXISTS student_roster (
  roll_number text PRIMARY KEY,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS roster_name_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roll_number text NOT NULL REFERENCES student_roster (roll_number),
  previous_name text,
  new_name text,
  actor text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE student_roster ENABLE ROW LEVEL SECURITY;
ALTER TABLE roster_name_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_roster FORCE ROW LEVEL SECURITY;
ALTER TABLE roster_name_audit FORCE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION current_faculty()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT current_setting('cforge.faculty', true) = '1'
$$;

DROP POLICY IF EXISTS roster_self ON student_roster;
CREATE POLICY roster_self ON student_roster
  FOR SELECT
  USING (
    roll_number = (
      SELECT roll_identifier FROM students WHERE id = current_student_id()
    )
  );

-- Faculty HTTP token is checked in application code. This GUC is transaction-local
-- and is set only by withFacultyTx / roster import. Not BYPASSRLS.
DROP POLICY IF EXISTS roster_faculty ON student_roster;
CREATE POLICY roster_faculty ON student_roster
  USING (current_faculty())
  WITH CHECK (current_faculty());

DROP POLICY IF EXISTS roster_audit_faculty ON roster_name_audit;
CREATE POLICY roster_audit_faculty ON roster_name_audit
  FOR INSERT
  WITH CHECK (current_faculty());

-- Students cannot read the audit log or the full roster.
GRANT SELECT ON student_roster TO cforge_app, cforge_student;
GRANT SELECT, INSERT, UPDATE ON student_roster TO cforge_app;
GRANT SELECT, INSERT ON roster_name_audit TO cforge_app;

SELECT set_config('cforge.faculty', '1', true);
INSERT INTO student_roster (roll_number)
SELECT '26EG104G' || lpad(n::text, 2, '0')
FROM generate_series(1, 51) AS n
ON CONFLICT (roll_number) DO NOTHING;
