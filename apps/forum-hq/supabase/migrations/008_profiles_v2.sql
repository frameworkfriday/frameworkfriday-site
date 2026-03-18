-- 008: Profiles v2 — community visibility, onboarding tracker, avatar URL

-- Add community visibility flag (default: visible to all FF community)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS community_visible boolean NOT NULL DEFAULT true;

-- Add onboarding completion tracker
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;

-- Add avatar URL (set by user during onboarding or profile edit)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- RLS: authenticated members can see any community-visible profile
-- (run manually if policy doesn't exist yet)
-- CREATE POLICY "Members see community-visible profiles"
--   ON profiles FOR SELECT
--   USING (community_visible = true AND auth.uid() IS NOT NULL);

-- Storage bucket: avatars (public, created via Storage API)
-- Policies applied via Storage API:
--   SELECT: public read (bucket is public)
--   INSERT: auth.uid()::text = (storage.foldername(name))[1]
