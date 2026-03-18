-- Add archived_at column to profiles for soft-delete
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS archived_at timestamptz DEFAULT NULL;
