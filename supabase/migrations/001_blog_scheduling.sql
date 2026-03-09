-- 001_blog_scheduling.sql
-- Upgrade blog_posts for draft + scheduled + published flow

alter table public.blog_posts
  add column if not exists status text default 'draft',
  add column if not exists publish_at timestamptz;

do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select c.conname
    from pg_constraint c
    join pg_class t on c.conrelid = t.oid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'blog_posts'
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%status%'
  loop
    execute format('alter table public.blog_posts drop constraint %I', constraint_name);
  end loop;
end $$;

update public.blog_posts
set status = case
  when coalesce(status, '') in ('draft', 'scheduled', 'published') then status
  when published_at is not null then 'published'
  else 'draft'
end;

alter table public.blog_posts
  alter column status set default 'draft',
  alter column status set not null;

alter table public.blog_posts
  add constraint blog_posts_status_check
  check (status in ('draft', 'scheduled', 'published'));

create index if not exists idx_blog_posts_scheduled
  on public.blog_posts (status, publish_at)
  where status = 'scheduled';
