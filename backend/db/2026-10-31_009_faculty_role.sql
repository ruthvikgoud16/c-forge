-- 2F.7.1 Faculty privilege is the cforge_faculty login, not the cforge.faculty GUC.
-- Additive. Does not rewrite 001–008. Does not grant SUPERUSER or BYPASSRLS.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cforge_faculty') THEN
    RAISE EXCEPTION 'cforge_faculty missing; run npm run provision-roles as admin';
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION current_faculty()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT current_user = 'cforge_faculty'
$$;

REVOKE ALL ON TABLE student_roster, roster_name_audit, invitations,
  learning_events, student_topic_placements, practice_assessment_attempts
  FROM cforge_faculty;

GRANT USAGE ON SCHEMA public TO cforge_faculty;

GRANT SELECT, UPDATE ON TABLE student_roster TO cforge_faculty;
GRANT SELECT, INSERT ON TABLE roster_name_audit TO cforge_faculty;
GRANT SELECT, INSERT, UPDATE ON TABLE invitations TO cforge_faculty;

GRANT SELECT (id, roll_identifier, status) ON TABLE students TO cforge_faculty;
GRANT SELECT (student_id, topic_id, kind, correct, created_at) ON TABLE learning_events TO cforge_faculty;
GRANT SELECT (student_id, topic_id, state) ON TABLE student_topic_placements TO cforge_faculty;
GRANT SELECT (student_id, assessment_id, earned, total, completed_at)
  ON TABLE practice_assessment_attempts TO cforge_faculty;
