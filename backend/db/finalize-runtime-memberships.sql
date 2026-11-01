-- Live cutover only. Role memberships are cluster-wide.
-- Run after DATABASE_URL uses cforge_app.

REVOKE cforge_app FROM cforge;
REVOKE cforge_owner FROM cforge;
REVOKE cforge_migrator FROM cforge;
ALTER ROLE cforge NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
