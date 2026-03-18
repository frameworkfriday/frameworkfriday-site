-- 007: Sessions v2 — optional group assignment + session types + group/session seeds

-- 1. Make group assignment optional (sessions can exist without a group)
ALTER TABLE sessions ALTER COLUMN forum_group_id DROP NOT NULL;

-- 2. Add session type
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS session_type text NOT NULL DEFAULT 'forum_session'
  CHECK (session_type IN ('forum_session', 'office_hours', 'ad_hoc'));

-- 3. Seed active groups
INSERT INTO forum_groups (name, slug, description) VALUES
  ('Forum Atlas',    'atlas',    'Q1 2026 cohort — active'),
  ('Forum Keystone', 'keystone', 'Q1 2026 cohort — active'),
  ('Forum Meridian', 'meridian', 'Q1 2026 cohort — active')
ON CONFLICT (slug) DO NOTHING;

-- 4. Seed April 2026 sessions (Forum Atlas, 10am PDT = 17:00 UTC)
DO $$
DECLARE atlas_id uuid;
BEGIN
  SELECT id INTO atlas_id FROM forum_groups WHERE slug = 'atlas';
  IF atlas_id IS NOT NULL THEN
    INSERT INTO sessions (forum_group_id, session_type, title, description, starts_at, duration_minutes)
    VALUES
      (atlas_id, 'forum_session', 'Session 1',      'Modified format — Welcome, Norms, Introductions, Group Discussion',    '2026-04-08T17:00:00Z', 90),
      (atlas_id, 'office_hours',  'Office Hours 1',  'Open Q&A, sidekick troubleshooting, commitment check-ins',            '2026-04-15T17:00:00Z', 60),
      (atlas_id, 'forum_session', 'Session 2',       'Standard format — Progress Reports, Group Discussion, Commitment Cycle','2026-04-22T17:00:00Z', 90),
      (atlas_id, 'office_hours',  'Office Hours 2',  'Open Q&A, advanced use cases, Month 1 retrospective prep',            '2026-04-29T17:00:00Z', 60);
  END IF;
END $$;
