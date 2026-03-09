-- 004_notes_upgrade_and_calendar.sql
-- Upgrade notes table + create calendar_events

-- Add type, pinned, content columns to existing notes table
ALTER TABLE notes
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'quick',
  ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS content jsonb;

-- Migrate existing body text → content jsonb for quick notes
UPDATE notes SET content = to_jsonb(body) WHERE content IS NULL AND body IS NOT NULL;

-- Calendar events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text NOT NULL DEFAULT 'general',
  -- 'seo' | 'blog' | 'project' | 'general'
  event_date date NOT NULL,
  event_time time,
  notes text,
  blog_post_id uuid REFERENCES blog_posts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events (event_date);
