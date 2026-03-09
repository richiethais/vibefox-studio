-- Run this in the Supabase SQL editor as the `postgres` role.
-- This script is safe for both first-time setup and upgrading an older blog_posts table.

create table if not exists public.blog_posts (
  id bigint generated always as identity primary key,
  title text not null,
  slug text not null unique,
  excerpt text not null,
  content text not null,
  category text default 'Digital Marketing',
  keywords text,
  read_time text default '6 min read',
  cover_image_url text,
  status text not null default 'draft',
  publish_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.blog_posts add column if not exists category text default 'Digital Marketing';
alter table public.blog_posts add column if not exists keywords text;
alter table public.blog_posts add column if not exists read_time text default '6 min read';
alter table public.blog_posts add column if not exists cover_image_url text;
alter table public.blog_posts add column if not exists status text default 'draft';
alter table public.blog_posts add column if not exists publish_at timestamptz;
alter table public.blog_posts add column if not exists published_at timestamptz;
alter table public.blog_posts add column if not exists created_at timestamptz not null default now();
alter table public.blog_posts add column if not exists updated_at timestamptz not null default now();

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

create index if not exists blog_posts_status_idx on public.blog_posts(status);
create index if not exists blog_posts_published_at_idx on public.blog_posts(published_at desc);
create index if not exists blog_posts_scheduled_idx on public.blog_posts(status, publish_at) where status = 'scheduled';

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_blog_posts_updated_at on public.blog_posts;
create trigger set_blog_posts_updated_at
before update on public.blog_posts
for each row execute procedure public.set_updated_at();

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

create extension if not exists pg_cron;

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

insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict (id) do nothing;

-- If you use RLS, make sure your admin policies allow insert/update/delete on public.blog_posts
-- and storage uploads to the blog-images bucket.
