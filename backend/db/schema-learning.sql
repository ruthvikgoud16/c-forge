-- Milestone 2D.1 learning state. Does not alter invitations, seat-cap, exercises, or judge tables.
-- Topic ids are catalog strings (u1-t2). They are not UUIDs: curriculum_topics was never seeded from catalog.json.

CREATE TABLE IF NOT EXISTS student_preferences (
  student_id uuid PRIMARY KEY REFERENCES students (id) ON DELETE CASCADE,
  start_intent text CHECK (start_intent IN (
    'from_scratch', 'test_knowledge', 'theory_weak_coding', 'exam_revision', 'problem_solving'
  )),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS diagnostic_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students (id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('open', 'submitted')) DEFAULT 'open',
  rubric_version text NOT NULL,
  curriculum_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz
);

CREATE TABLE IF NOT EXISTS diagnostic_session_items (
  session_id uuid NOT NULL REFERENCES diagnostic_sessions (id) ON DELETE CASCADE,
  item_id text NOT NULL,
  ordinal int NOT NULL,
  PRIMARY KEY (session_id, item_id)
);

CREATE TABLE IF NOT EXISTS diagnostic_answers (
  session_id uuid NOT NULL REFERENCES diagnostic_sessions (id) ON DELETE CASCADE,
  item_id text NOT NULL,
  student_id uuid NOT NULL REFERENCES students (id) ON DELETE CASCADE,
  response jsonb NOT NULL,
  correct boolean NOT NULL,
  method text NOT NULL,
  topic_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, item_id)
);

CREATE TABLE IF NOT EXISTS student_topic_placements (
  student_id uuid NOT NULL REFERENCES students (id) ON DELETE CASCADE,
  topic_id text NOT NULL,
  state text NOT NULL CHECK (state IN (
    'NOT_ASSESSED', 'NEEDS_FOUNDATION', 'NEEDS_LEARNING',
    'PARTIALLY_DEMONSTRATED', 'DEMONSTRATED', 'NEEDS_REVISION'
  )),
  rubric_version text NOT NULL,
  curriculum_version text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, topic_id)
);

CREATE TABLE IF NOT EXISTS learning_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students (id) ON DELETE CASCADE,
  topic_id text NOT NULL,
  lesson_id text,
  kind text NOT NULL,
  dimension text NOT NULL,
  method text,
  assisted boolean NOT NULL DEFAULT false,
  correct boolean,
  curriculum_version text NOT NULL,
  rubric_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assessment_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students (id) ON DELETE CASCADE,
  kind text NOT NULL,
  session_id uuid REFERENCES diagnostic_sessions (id) ON DELETE SET NULL,
  rubric_version text NOT NULL,
  curriculum_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE student_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_session_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_topic_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_attempts ENABLE ROW LEVEL SECURITY;

-- Table owner (migration role) must also obey tenant policies when using SET ROLE cforge_app.
ALTER TABLE student_preferences FORCE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_session_items FORCE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_answers FORCE ROW LEVEL SECURITY;
ALTER TABLE student_topic_placements FORCE ROW LEVEL SECURITY;
ALTER TABLE learning_events FORCE ROW LEVEL SECURITY;
ALTER TABLE assessment_attempts FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pref_owner ON student_preferences;
CREATE POLICY pref_owner ON student_preferences
  USING (student_id = current_student_id())
  WITH CHECK (student_id = current_student_id());

DROP POLICY IF EXISTS diag_owner ON diagnostic_sessions;
CREATE POLICY diag_owner ON diagnostic_sessions
  USING (student_id = current_student_id())
  WITH CHECK (student_id = current_student_id());

DROP POLICY IF EXISTS diag_items_owner ON diagnostic_session_items;
CREATE POLICY diag_items_owner ON diagnostic_session_items
  USING (EXISTS (
    SELECT 1 FROM diagnostic_sessions s
    WHERE s.id = session_id AND s.student_id = current_student_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM diagnostic_sessions s
    WHERE s.id = session_id AND s.student_id = current_student_id()
  ));

DROP POLICY IF EXISTS diag_ans_owner ON diagnostic_answers;
CREATE POLICY diag_ans_owner ON diagnostic_answers
  USING (student_id = current_student_id())
  WITH CHECK (student_id = current_student_id());

DROP POLICY IF EXISTS place_owner ON student_topic_placements;
CREATE POLICY place_owner ON student_topic_placements
  USING (student_id = current_student_id())
  WITH CHECK (student_id = current_student_id());

DROP POLICY IF EXISTS learn_ev_owner ON learning_events;
CREATE POLICY learn_ev_owner ON learning_events
  USING (student_id = current_student_id())
  WITH CHECK (student_id = current_student_id());

DROP POLICY IF EXISTS assess_owner ON assessment_attempts;
CREATE POLICY assess_owner ON assessment_attempts
  USING (student_id = current_student_id())
  WITH CHECK (student_id = current_student_id());

GRANT SELECT, INSERT, UPDATE ON student_preferences, diagnostic_sessions,
  diagnostic_session_items, diagnostic_answers, student_topic_placements,
  learning_events, assessment_attempts TO cforge_app;

GRANT SELECT, INSERT, UPDATE ON student_preferences, diagnostic_sessions,
  diagnostic_answers, student_topic_placements, learning_events, assessment_attempts
  TO cforge_student;
GRANT SELECT ON diagnostic_session_items TO cforge_student;

-- Application connections SET LOCAL ROLE cforge_app after set_config('cforge.student_id', …, true).
-- Role membership is granted by db/provision-roles.sql (admin). Do not swallow GRANT errors here.
