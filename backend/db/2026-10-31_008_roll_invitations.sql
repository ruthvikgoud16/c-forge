-- 2F.5.1 Bind invitations to an approved roster roll.
-- Additive. Does not rewrite 001–007. Does not invent accounts.

ALTER TABLE invitations ADD COLUMN IF NOT EXISTS roll_number text;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS revoked_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'invitations_roll_roster_fk'
  ) THEN
    ALTER TABLE invitations
      ADD CONSTRAINT invitations_roll_roster_fk
      FOREIGN KEY (roll_number) REFERENCES student_roster (roll_number);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS invitations_roll_number_idx ON invitations (roll_number);

UPDATE invitations
SET revoked_at = now()
WHERE roll_number IS NULL
  AND consumed_at IS NULL
  AND revoked_at IS NULL;

CREATE OR REPLACE FUNCTION invitations_enforce_roll_bind()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.roll_number IS DISTINCT FROM NEW.roll_number THEN
    RAISE EXCEPTION 'invitation_roll_immutable' USING ERRCODE = 'P0001';
  END IF;
  IF NEW.roll_number IS NULL THEN
    RAISE EXCEPTION 'invitation_roll_required' USING ERRCODE = 'P0001';
  END IF;
  IF NEW.consumed_at IS NULL AND NEW.revoked_at IS NULL THEN
    IF EXISTS (
      SELECT 1 FROM invitations
      WHERE roll_number = NEW.roll_number
        AND id <> NEW.id
        AND consumed_at IS NULL
        AND revoked_at IS NULL
        AND expires_at > now()
    ) THEN
      RAISE EXCEPTION 'duplicate_invitation' USING ERRCODE = 'P0001';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS invitations_roll_bind ON invitations;
CREATE TRIGGER invitations_roll_bind
BEFORE INSERT OR UPDATE ON invitations
FOR EACH ROW
EXECUTE FUNCTION invitations_enforce_roll_bind();
