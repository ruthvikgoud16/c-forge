-- 2F.8.2 Assert owner/runtime split. Additive. Does not rewrite 001–012.
-- Must run as cforge_owner after transfer-ownership.sql.
-- No SUPERUSER / BYPASSRLS. No REASSIGN (provisioning does that).

DO $$
DECLARE
  wrong int;
BEGIN
  IF current_user <> 'cforge_owner' THEN
    RAISE EXCEPTION '013 must run as cforge_owner (migrator SET ROLE)';
  END IF;

  SELECT count(*) INTO wrong
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND pg_get_userbyid(c.relowner) <> 'cforge_owner';
  IF wrong > 0 THEN
    RAISE EXCEPTION 'public tables must be owned by cforge_owner';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_roles
    WHERE rolname IN ('cforge_app', 'cforge_faculty', 'cforge_migrator', 'cforge_student')
      AND (rolsuper OR rolbypassrls)
  ) THEN
    RAISE EXCEPTION 'runtime/migrator roles must not be SUPERUSER or BYPASSRLS';
  END IF;

END
$$;

REVOKE ALL ON TABLE schema_migrations FROM PUBLIC;
REVOKE ALL ON TABLE schema_migrations FROM cforge, cforge_app, cforge_student, cforge_faculty;
