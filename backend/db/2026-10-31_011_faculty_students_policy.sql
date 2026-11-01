-- Faculty may list account status, not passwords. students are ENABLE RLS.
-- Additive. Does not rewrite 001–010.

DROP POLICY IF EXISTS students_faculty ON students;
CREATE POLICY students_faculty ON students
  FOR SELECT
  USING (current_faculty());
