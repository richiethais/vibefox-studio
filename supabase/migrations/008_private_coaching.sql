-- 008_private_coaching.sql — add payment-tracking columns for private coaching inquiries

alter table public.inquiries
  add column if not exists status text not null default 'new',
  add column if not exists stripe_session_id text,
  add column if not exists amount_paid_cents integer,
  add column if not exists paid_at timestamptz,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'inquiries_status_check'
  ) then
    alter table public.inquiries
      add constraint inquiries_status_check
      check (status in ('new', 'pending_payment', 'paid', 'checkout_failed'));
  end if;
end$$;

create index if not exists inquiries_form_key_status_idx
  on public.inquiries (form_key, status);

create unique index if not exists inquiries_stripe_session_id_unique_idx
  on public.inquiries (stripe_session_id)
  where stripe_session_id is not null;
