-- Run in Supabase SQL editor to enable Admin Blog Manager.

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
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists blog_posts_status_idx on public.blog_posts(status);
create index if not exists blog_posts_published_at_idx on public.blog_posts(published_at desc);

-- Optional trigger to auto-update updated_at.
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

-- Storage bucket for blog images.
insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict (id) do nothing;

-- NOTE: Update RLS policies to match your auth model.
-- If admin users are identified by email, add strict admin-only policies.
