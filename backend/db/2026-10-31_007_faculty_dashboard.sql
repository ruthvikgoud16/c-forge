-- 2F.5 Faculty dashboard: four additional official rolls, 55-seat cap,
-- faculty SELECT aggregates on FORCE RLS learning tables.
-- Does not rewrite 001–005 or seed.sql. Does not invent student accounts.

SELECT set_config('cforge.faculty', '1', true);
INSERT INTO student_roster (roll_number)
SELECT '26EG104G' || lpad(n::text, 2, '0')
FROM generate_series(52, 55) AS n
ON CONFLICT (roll_number) DO NOTHING;

CREATE OR REPLACE FUNCTION students_enforce_seat_cap()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  active_count int;
BEGIN
  IF NEW.status = 'active' THEN
    SELECT count(*) INTO active_count FROM students WHERE status = 'active' AND id <> NEW.id;
    IF active_count >= 55 THEN
      RAISE EXCEPTION 'SEAT_CAP' USING ERRCODE = 'P0001';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Faculty Bearer is checked in application code. GUC is transaction-local via withFacultyTx.
-- SELECT only. No answer keys, hidden tests, or diagnostic item values.
DROP POLICY IF EXISTS learn_ev_faculty ON learning_events;
CREATE POLICY learn_ev_faculty ON learning_events
  FOR SELECT
  USING (current_faculty());

DROP POLICY IF EXISTS placements_faculty ON student_topic_placements;
CREATE POLICY placements_faculty ON student_topic_placements
  FOR SELECT
  USING (current_faculty());

DROP POLICY IF EXISTS practice_assess_faculty ON practice_assessment_attempts;
CREATE POLICY practice_assess_faculty ON practice_assessment_attempts
  FOR SELECT
  USING (current_faculty());
