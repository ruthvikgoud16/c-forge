CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roll_identifier text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'revoked')) DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  consumed_by uuid REFERENCES students (id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  objective text NOT NULL,
  statement text NOT NULL,
  input_format text NOT NULL,
  output_format text NOT NULL,
  constraints_text text NOT NULL,
  starter_code text NOT NULL,
  language text NOT NULL DEFAULT 'c',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS exercise_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id uuid NOT NULL REFERENCES exercises (id) ON DELETE CASCADE,
  ordinal int NOT NULL,
  visibility text NOT NULL CHECK (visibility IN ('sample', 'hidden')),
  stdin text NOT NULL,
  expected_stdout text NOT NULL,
  UNIQUE (exercise_id, ordinal)
);

CREATE TABLE IF NOT EXISTS submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students (id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES exercises (id) ON DELETE CASCADE,
  mode text NOT NULL CHECK (mode IN ('run', 'submit')),
  verdict text NOT NULL,
  passed int NOT NULL DEFAULT 0,
  total int NOT NULL DEFAULT 0,
  compiler_log text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION students_enforce_seat_cap()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  active_count int;
BEGIN
  IF NEW.status = 'active' THEN
    SELECT count(*) INTO active_count FROM students WHERE status = 'active' AND id <> NEW.id;
    IF active_count >= 51 THEN
      RAISE EXCEPTION 'SEAT_CAP' USING ERRCODE = 'P0001';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS students_seat_cap ON students;
CREATE TRIGGER students_seat_cap
BEFORE INSERT OR UPDATE ON students
FOR EACH ROW
EXECUTE FUNCTION students_enforce_seat_cap();

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION current_student_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('cforge.student_id', true), '')::uuid
$$;

DROP POLICY IF EXISTS students_self ON students;
CREATE POLICY students_self ON students
  FOR SELECT
  USING (id = current_student_id());

DROP POLICY IF EXISTS exercises_read ON exercises;
CREATE POLICY exercises_read ON exercises
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS submissions_owner ON submissions;
CREATE POLICY submissions_owner ON submissions
  FOR SELECT
  USING (student_id = current_student_id());

-- No student policy on exercise_tests or invitations: deny by default.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cforge_app') THEN
    RAISE EXCEPTION 'cforge_app missing; run npm run provision-roles as admin';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cforge_student') THEN
    RAISE EXCEPTION 'cforge_student missing; run npm run provision-roles as admin';
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO cforge_app, cforge_student;
GRANT SELECT, INSERT, UPDATE ON students, invitations, submissions TO cforge_app;
GRANT SELECT ON exercises, exercise_tests TO cforge_app;
GRANT SELECT ON exercises TO cforge_student;
GRANT SELECT ON students, submissions TO cforge_student;
