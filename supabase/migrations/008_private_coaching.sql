-- 008_private_coaching.sql — add payment-tracking columns for private coaching inquiries

alter table public.inquiries
  add column if not exists status text not null default 'new',
  add column if not exists stripe_session_id text,
  add column if not exists amount_paid_cents integer,
  add column if not exists paid_at timestamptz,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists inquiries_form_key_status_idx
  on public.inquiries (form_key, status);

create index if not exists inquiries_stripe_session_id_idx
  on public.inquiries (stripe_session_id)
  where stripe_session_id is not null;
