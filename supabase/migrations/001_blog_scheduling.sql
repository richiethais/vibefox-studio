-- 001_blog_scheduling.sql
-- Add scheduling columns to blog_posts

ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS publish_at timestamptz;

-- Backfill: existing posts are published
UPDATE blog_posts SET status = 'published' WHERE status IS NULL OR status = '';

-- Index for the cron query
CREATE INDEX IF NOT EXISTS idx_blog_posts_scheduled
  ON blog_posts (status, publish_at)
  WHERE status = 'scheduled';
