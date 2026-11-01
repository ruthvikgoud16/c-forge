-- Milestone 2F.1 — topic/unit practice assessment attempts.
-- Does not replace diagnostic assessment_attempts in schema-learning.sql.
-- Answer keys stay in application code, not in these tables.

CREATE TABLE IF NOT EXISTS practice_assessment_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students (id) ON DELETE CASCADE,
  assessment_id text NOT NULL,
  attempt_no int NOT NULL CHECK (attempt_no > 0),
  earned int NOT NULL CHECK (earned >= 0),
  total int NOT NULL CHECK (total >= 0),
  by_topic jsonb NOT NULL DEFAULT '{}'::jsonb,
  responses jsonb NOT NULL DEFAULT '{}'::jsonb,
  item_results jsonb NOT NULL DEFAULT '[]'::jsonb,
  started_at timestamptz NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  idempotency_key text,
  UNIQUE (student_id, assessment_id, attempt_no)
);

CREATE UNIQUE INDEX IF NOT EXISTS practice_assessment_idemp
  ON practice_assessment_attempts (student_id, assessment_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS practice_assessment_student_idx
  ON practice_assessment_attempts (student_id, assessment_id, completed_at DESC);

ALTER TABLE practice_assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_assessment_attempts FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS practice_assess_owner ON practice_assessment_attempts;
CREATE POLICY practice_assess_owner ON practice_assessment_attempts
  USING (student_id = current_student_id())
  WITH CHECK (student_id = current_student_id());

GRANT SELECT, INSERT, UPDATE ON practice_assessment_attempts TO cforge_app, cforge_student;
-- No DELETE: attempts are append-only for the application role.
