-- Migration 016: Add onboarding_path to profiles
-- Determines which onboarding checklist track a member sees.
-- 'ds-graduate' = completed a Decision Sprint before joining Forum
-- NULL = did not come through a Decision Sprint

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_path text;
