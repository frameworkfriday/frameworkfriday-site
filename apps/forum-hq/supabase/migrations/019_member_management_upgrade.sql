-- 019: Member management upgrade
-- Adds extended profile fields (based on Vistage/EO/YPO research)
-- Creates member_audit_log for change tracking

-- ============================================================
-- 1. Extended profile fields
-- ============================================================

-- Contact
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address_line1 text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address_line2 text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS zip text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone text;

-- Social (these were referenced in code but never migrated)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website_url text;

-- Business
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS industry text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_revenue_range text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employee_count_range text;

-- Personal
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birthday date;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS spouse_partner_name text;

-- Membership context
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS goals text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_source text;

-- ============================================================
-- 2. Member audit log
-- ============================================================

CREATE TABLE IF NOT EXISTS member_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action text NOT NULL,
  details jsonb DEFAULT '{}',
  performed_by text NOT NULL DEFAULT 'system',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_member ON member_audit_log(member_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON member_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON member_audit_log(action);

-- Seed initial "member_joined" audit entries from existing profiles
INSERT INTO member_audit_log (member_id, action, details, performed_by, created_at)
SELECT
  id,
  'member_joined',
  jsonb_build_object('email', email, 'first_name', first_name, 'last_name', last_name),
  'system',
  created_at
FROM profiles
WHERE id NOT IN (SELECT DISTINCT member_id FROM member_audit_log WHERE action = 'member_joined')
ON CONFLICT DO NOTHING;

-- Seed initial group assignments from existing memberships
INSERT INTO member_audit_log (member_id, action, details, performed_by, created_at)
SELECT
  fgm.user_id,
  'group_assigned',
  jsonb_build_object('group_id', fgm.forum_group_id, 'group_name', fg.name, 'role', fgm.role),
  'system',
  fgm.joined_at
FROM forum_group_members fgm
JOIN forum_groups fg ON fg.id = fgm.forum_group_id
ON CONFLICT DO NOTHING;
