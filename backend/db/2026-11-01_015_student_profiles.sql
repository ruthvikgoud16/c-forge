-- Additive student profile: optional DOB and appearance.
-- Does not rewrite 001–014. Does not create accounts. Faculty has no access.

CREATE TABLE IF NOT EXISTS student_profiles (
  student_id uuid PRIMARY KEY REFERENCES students (id),
  date_of_birth date,
  appearance text CHECK (appearance IS NULL OR appearance IN ('light', 'dark')),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS student_profiles_self ON student_profiles;
CREATE POLICY student_profiles_self ON student_profiles
  USING (student_id = current_student_id())
  WITH CHECK (student_id = current_student_id());

REVOKE ALL ON TABLE student_profiles FROM PUBLIC;
REVOKE ALL ON TABLE student_profiles FROM cforge_faculty, cforge_student;
GRANT SELECT, INSERT, UPDATE ON TABLE student_profiles TO cforge_app;
