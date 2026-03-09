-- 003_seo_notes.sql
-- Create seo_notes table

CREATE TABLE IF NOT EXISTS seo_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'quick',
  -- 'quick' = plain text note
  -- 'strategy' = array of {heading, body} sections
  pinned boolean NOT NULL DEFAULT false,
  content jsonb NOT NULL DEFAULT '""',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seo_notes_pinned ON seo_notes (pinned, created_at DESC);
