-- Administrator-only role provisioning. Do not run as the application login.
-- Does not create application tables. Does not grant SUPERUSER or BYPASSRLS.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_roles
    WHERE rolname = current_user AND (rolsuper OR rolcreaterole)
  ) THEN
    RAISE EXCEPTION 'provision-roles must run as CREATEROLE or superuser';
  END IF;
END
$$;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cforge') THEN
    CREATE ROLE cforge LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cforge_app') THEN
    CREATE ROLE cforge_app LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cforge_student') THEN
    CREATE ROLE cforge_student NOLOGIN NOSUPERUSER NOBYPASSRLS;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cforge_faculty') THEN
    CREATE ROLE cforge_faculty LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cforge_owner') THEN
    CREATE ROLE cforge_owner NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cforge_migrator') THEN
    CREATE ROLE cforge_migrator LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOINHERIT;
  END IF;
END
$$;

DO $$
BEGIN
  EXECUTE 'GRANT cforge_owner TO cforge_migrator';
  EXECUTE 'REVOKE cforge_owner FROM cforge';
  EXECUTE 'REVOKE cforge_owner FROM cforge_app';
  EXECUTE 'REVOKE cforge_owner FROM cforge_faculty';
  EXECUTE 'REVOKE cforge_migrator FROM cforge';
  EXECUTE 'REVOKE cforge_migrator FROM cforge_app';
  EXECUTE 'REVOKE cforge_migrator FROM cforge_faculty';
  EXECUTE 'REVOKE cforge_faculty FROM cforge';
END
$$;

DO $$
BEGIN
  EXECUTE format(
    'GRANT CONNECT ON DATABASE %I TO cforge_app, cforge_faculty, cforge_migrator',
    current_database()
  );
END
$$;
GRANT USAGE ON SCHEMA public TO cforge_app, cforge_faculty, cforge_migrator;
GRANT USAGE, CREATE ON SCHEMA public TO cforge_owner;
