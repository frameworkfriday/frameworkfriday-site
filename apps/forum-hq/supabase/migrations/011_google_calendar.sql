-- Add Google Calendar integration columns
ALTER TABLE forum_groups ADD COLUMN IF NOT EXISTS google_calendar_id text DEFAULT NULL;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS google_event_id text DEFAULT NULL;
