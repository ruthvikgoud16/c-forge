-- 2F.7.1 Faculty INSERT/UPDATE on invitations needs an RLS policy.
-- invitations are ENABLE RLS (not FORCE). cforge_faculty is not the owner.
-- Additive. Does not rewrite 001–009.

DROP POLICY IF EXISTS invitations_faculty ON invitations;
CREATE POLICY invitations_faculty ON invitations
  USING (current_faculty())
  WITH CHECK (current_faculty());
