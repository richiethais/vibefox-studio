-- 002_blog_cron_job.sql
-- Enable pg_cron and schedule auto-publish job
-- NOTE: First enable pg_cron in Supabase Dashboard → Database → Extensions

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule job: every minute, publish posts whose time has arrived
SELECT cron.schedule(
  'publish-scheduled-posts',
  '* * * * *',
  $$
    UPDATE blog_posts
    SET status = 'published', published_at = now()
    WHERE status = 'scheduled' AND publish_at <= now()
  $$
);
