-- 009: Facilitator role — group-scoped admin capability
-- Adds a role column to forum_group_members: 'member' (default) or 'facilitator'

ALTER TABLE forum_group_members
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'member';

ALTER TABLE forum_group_members
  DROP CONSTRAINT IF EXISTS forum_group_members_role_check;

ALTER TABLE forum_group_members
  ADD CONSTRAINT forum_group_members_role_check CHECK (role IN ('member', 'facilitator'));
