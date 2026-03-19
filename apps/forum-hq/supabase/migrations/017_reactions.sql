-- Migration 017: Post reactions (emoji reactions like Discord/Slack)
CREATE TABLE IF NOT EXISTS reactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id, emoji)
);

-- RLS
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can see reactions
CREATE POLICY "reactions_select" ON reactions FOR SELECT USING (true);

-- Users can add their own reactions
CREATE POLICY "reactions_insert" ON reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can remove their own reactions
CREATE POLICY "reactions_delete" ON reactions FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast lookup by post
CREATE INDEX IF NOT EXISTS idx_reactions_post ON reactions(post_id);
