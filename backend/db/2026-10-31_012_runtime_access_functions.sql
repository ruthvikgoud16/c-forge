-- 2F.8.1 Narrow SECURITY DEFINER accessors so runtime can stop using owner DML.
-- Additive. Does not rewrite 001–011. Does not REASSIGN ownership.
-- No SUPERUSER / BYPASSRLS. No invitation or exercise_tests table SELECT for cforge_app.

CREATE OR REPLACE FUNCTION academy_login_lookup(p_roll text)
RETURNS TABLE (id uuid, roll_identifier text, password_hash text, status text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT s.id, s.roll_identifier, s.password_hash, s.status
  FROM public.students s
  WHERE s.roll_identifier = p_roll
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION academy_accept_invitation(
  p_token_hash text,
  p_roll text,
  p_student_id uuid,
  p_password_hash text
)
RETURNS TABLE (error_code text, student_id uuid, roll_identifier text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  inv public.invitations%ROWTYPE;
BEGIN
  IF p_token_hash IS NULL OR p_token_hash = '' OR p_roll IS NULL
     OR p_student_id IS NULL OR p_password_hash IS NULL OR p_password_hash = '' THEN
    error_code := 'invalid_invitation';
    RETURN NEXT;
    RETURN;
  END IF;

  SELECT * INTO inv
  FROM public.invitations
  WHERE token_hash = p_token_hash
  FOR UPDATE;

  IF NOT FOUND THEN
    error_code := 'invalid_invitation';
    RETURN NEXT;
    RETURN;
  END IF;

  IF inv.revoked_at IS NOT NULL THEN
    error_code := 'revoked_invitation';
    RETURN NEXT;
    RETURN;
  END IF;

  IF inv.consumed_at IS NOT NULL THEN
    error_code := 'already_registered';
    RETURN NEXT;
    RETURN;
  END IF;

  IF inv.expires_at <= clock_timestamp() THEN
    error_code := 'invalid_invitation';
    RETURN NEXT;
    RETURN;
  END IF;

  IF inv.roll_number IS DISTINCT FROM p_roll THEN
    error_code := 'roll_mismatch';
    RETURN NEXT;
    RETURN;
  END IF;

  PERFORM s.id FROM public.students s WHERE s.roll_identifier = p_roll FOR UPDATE;
  IF FOUND THEN
    error_code := 'already_registered';
    RETURN NEXT;
    RETURN;
  END IF;

  INSERT INTO public.students (id, roll_identifier, password_hash, status)
  VALUES (p_student_id, p_roll, p_password_hash, 'active');

  UPDATE public.invitations
  SET consumed_at = clock_timestamp(), consumed_by = p_student_id
  WHERE id = inv.id;

  error_code := NULL;
  student_id := p_student_id;
  roll_identifier := p_roll;
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION academy_exercise_tests(p_exercise_id uuid)
RETURNS TABLE (ordinal int, visibility text, stdin text, expected_stdout text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT t.ordinal, t.visibility, t.stdin, t.expected_stdout
  FROM public.exercise_tests t
  WHERE t.exercise_id = p_exercise_id
  ORDER BY t.ordinal;
$$;

REVOKE ALL ON FUNCTION academy_login_lookup(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION academy_accept_invitation(text, text, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION academy_exercise_tests(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION academy_login_lookup(text) TO cforge_app;
GRANT EXECUTE ON FUNCTION academy_accept_invitation(text, text, uuid, text) TO cforge_app;
GRANT EXECUTE ON FUNCTION academy_exercise_tests(uuid) TO cforge_app;

REVOKE SELECT, INSERT, UPDATE ON TABLE invitations FROM cforge_app;
REVOKE SELECT ON TABLE exercise_tests FROM cforge_app;
REVOKE SELECT, INSERT, UPDATE ON TABLE students FROM cforge_app;
REVOKE SELECT ON TABLE students FROM cforge_student;

GRANT SELECT (id, roll_identifier, status, created_at) ON TABLE students TO cforge_app, cforge_student;
