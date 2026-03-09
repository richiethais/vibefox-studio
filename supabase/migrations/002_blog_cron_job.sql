-- 002_blog_cron_job.sql
-- Enable pg_cron and schedule auto-publish job
-- NOTE: First enable pg_cron in Supabase Dashboard → Database → Extensions

CREATE EXTENSION IF NOT EXISTS pg_cron;

create or replace function public.publish_due_blog_posts()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  update public.blog_posts
  set status = 'published',
      published_at = coalesce(publish_at, now()),
      updated_at = now()
  where status = 'scheduled'
    and publish_at is not null
    and publish_at <= now();

  get diagnostics affected = row_count;
  return affected;
end;
$$;

grant execute on function public.publish_due_blog_posts() to anon, authenticated, service_role;

do $$
begin
  if not exists (
    select 1
    from cron.job
    where jobname = 'publish-scheduled-posts'
  ) then
    perform cron.schedule(
      'publish-scheduled-posts',
      '* * * * *',
      $job$select public.publish_due_blog_posts();$job$
    );
  end if;
end $$;
