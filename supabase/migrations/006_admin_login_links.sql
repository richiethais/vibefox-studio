create table if not exists public.admin_login_links (
  id uuid primary key default gen_random_uuid(),
  token uuid not null unique default gen_random_uuid(),
  label text,
  action_link text,
  persist_session boolean not null default true,
  created_by_email text not null,
  expires_at timestamptz not null default (now() + interval '1 hour'),
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists admin_login_links_created_at_idx
  on public.admin_login_links (created_at desc);

create index if not exists admin_login_links_expires_at_idx
  on public.admin_login_links (expires_at asc);

alter table public.admin_login_links enable row level security;

drop policy if exists "admin all" on public.admin_login_links;

create policy "admin all" on public.admin_login_links
  for all using (auth.jwt() ->> 'email' = 'richiethais@gmail.com');
