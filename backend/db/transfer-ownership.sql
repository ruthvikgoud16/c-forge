-- Superuser-only. Current database objects only.
-- Do not use REASSIGN OWNED: that also reassigns shared objects (other databases).
-- Do not revoke cluster role memberships here (that would affect live).
-- No SUPERUSER / BYPASSRLS.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname = current_user AND rolsuper
  ) THEN
    RAISE EXCEPTION 'transfer-ownership requires superuser';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cforge_owner') THEN
    RAISE EXCEPTION 'cforge_owner missing; run provision-roles';
  END IF;
END
$$;

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT n.nspname, c.relname, c.relkind
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relowner = (SELECT oid FROM pg_roles WHERE rolname = 'cforge')
  LOOP
    IF r.relkind = 'S' THEN
      EXECUTE format('ALTER SEQUENCE %I.%I OWNER TO cforge_owner', r.nspname, r.relname);
    ELSE
      EXECUTE format('ALTER TABLE %I.%I OWNER TO cforge_owner', r.nspname, r.relname);
    END IF;
  END LOOP;

  FOR r IN
    SELECT p.oid::regprocedure AS fn
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proowner = (SELECT oid FROM pg_roles WHERE rolname = 'cforge')
  LOOP
    EXECUTE format('ALTER FUNCTION %s OWNER TO cforge_owner', r.fn);
  END LOOP;
END
$$;

DO $$
BEGIN
  EXECUTE format('ALTER DATABASE %I OWNER TO cforge_owner', current_database());
  EXECUTE format(
    'GRANT CONNECT ON DATABASE %I TO cforge_app, cforge_faculty, cforge_migrator',
    current_database()
  );
END
$$;

GRANT USAGE ON SCHEMA public TO cforge_app, cforge_faculty, cforge_migrator;
GRANT USAGE, CREATE ON SCHEMA public TO cforge_owner;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM cforge;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM cforge;

ALTER ROLE cforge_owner NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
ALTER ROLE cforge_app LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
ALTER ROLE cforge_faculty LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOINHERIT;
ALTER ROLE cforge_migrator LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOINHERIT;
