-- Curriculum foundation. Does not alter judge, invitations, or seat-cap tables.
-- OFFICIAL rows may be inserted only after verified PDF ingestion.

CREATE TABLE IF NOT EXISTS curriculum_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL UNIQUE,
  status text NOT NULL CHECK (status IN ('pending_syllabus', 'draft', 'published')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS curriculum_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES curriculum_versions (id) ON DELETE CASCADE,
  ordinal int NOT NULL,
  source_label text,
  title text NOT NULL,
  kind text NOT NULL DEFAULT 'official' CHECK (kind IN ('official', 'foundation')),
  classification text NOT NULL CHECK (classification IN ('OFFICIAL', 'SUPPORTING', 'EXTENSION', 'LEGACY_UNVERIFIED')),
  pdf_page int,
  needs_human_verification boolean NOT NULL DEFAULT true,
  UNIQUE (version_id, ordinal)
);

CREATE TABLE IF NOT EXISTS curriculum_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES curriculum_units (id) ON DELETE CASCADE,
  ordinal int NOT NULL,
  source_label text,
  title text NOT NULL,
  classification text NOT NULL CHECK (classification IN ('OFFICIAL', 'SUPPORTING', 'EXTENSION', 'LEGACY_UNVERIFIED')),
  learning_outcomes text[] NOT NULL DEFAULT '{}',
  pdf_page int,
  needs_human_verification boolean NOT NULL DEFAULT true,
  UNIQUE (unit_id, ordinal)
);

CREATE TABLE IF NOT EXISTS curriculum_prerequisites (
  topic_id uuid NOT NULL REFERENCES curriculum_topics (id) ON DELETE CASCADE,
  prerequisite_topic_id uuid NOT NULL REFERENCES curriculum_topics (id) ON DELETE CASCADE,
  PRIMARY KEY (topic_id, prerequisite_topic_id),
  CHECK (topic_id <> prerequisite_topic_id)
);

CREATE TABLE IF NOT EXISTS curriculum_subtopics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES curriculum_topics (id) ON DELETE CASCADE,
  ordinal int NOT NULL,
  title text NOT NULL,
  UNIQUE (topic_id, ordinal)
);

CREATE TABLE IF NOT EXISTS lesson_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subtopic_id uuid NOT NULL REFERENCES curriculum_subtopics (id) ON DELETE CASCADE,
  ordinal int NOT NULL,
  title text NOT NULL,
  kind text NOT NULL DEFAULT 'official' CHECK (kind IN ('official', 'foundation')),
  classification text NOT NULL CHECK (classification IN ('OFFICIAL', 'SUPPORTING', 'EXTENSION', 'LEGACY_UNVERIFIED')),
  mode text NOT NULL CHECK (mode IN ('learning', 'exam')),
  body jsonb NOT NULL,
  UNIQUE (subtopic_id, ordinal)
);

CREATE TABLE IF NOT EXISTS lesson_exercise_links (
  lesson_id uuid NOT NULL REFERENCES lesson_documents (id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES exercises (id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('guided', 'independent')),
  PRIMARY KEY (lesson_id, exercise_id)
);

CREATE TABLE IF NOT EXISTS mastery_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students (id) ON DELETE CASCADE,
  topic_id uuid REFERENCES curriculum_topics (id) ON DELETE SET NULL,
  lesson_id uuid REFERENCES lesson_documents (id) ON DELETE SET NULL,
  kind text NOT NULL,
  dimension text NOT NULL,
  assisted boolean NOT NULL DEFAULT false,
  correct boolean,
  hint_count int NOT NULL DEFAULT 0,
  duration_ms int,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE curriculum_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_prerequisites ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_subtopics ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_exercise_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE mastery_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY curriculum_read_published ON curriculum_versions
  FOR SELECT USING (status IN ('draft', 'published', 'pending_syllabus'));

CREATE POLICY curriculum_units_read ON curriculum_units FOR SELECT USING (true);
CREATE POLICY curriculum_topics_read ON curriculum_topics FOR SELECT USING (true);
CREATE POLICY curriculum_subtopics_read ON curriculum_subtopics FOR SELECT USING (true);
CREATE POLICY lessons_read ON lesson_documents FOR SELECT USING (true);

CREATE POLICY mastery_owner ON mastery_events
  FOR SELECT USING (student_id = current_student_id());

INSERT INTO curriculum_versions (label, status)
VALUES ('pending-syllabus-pdf', 'pending_syllabus')
ON CONFLICT (label) DO NOTHING;
