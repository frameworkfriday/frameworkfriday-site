-- Migration 018: Add badge_color to forum_groups for visual group identity
ALTER TABLE forum_groups ADD COLUMN IF NOT EXISTS badge_color text DEFAULT '#3B82F6';

-- Seed some distinct colors for existing groups
-- (These can be changed by admins later)
UPDATE forum_groups SET badge_color = '#3B82F6' WHERE badge_color IS NULL;
