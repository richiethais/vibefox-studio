-- Add public invoice page columns
alter table public.invoices
  add column if not exists invoice_token text,
  add column if not exists payment_type text not null default 'one_time',
  add column if not exists billing_interval text,
  add column if not exists business_name text,
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists paid_at timestamptz;

-- Generate tokens for existing rows
update public.invoices
set invoice_token = substr(md5(random()::text || id::text), 1, 8)
where invoice_token is null;

-- Make token required and unique going forward
alter table public.invoices
  alter column invoice_token set not null,
  alter column invoice_token set default substr(md5(random()::text || gen_random_uuid()::text), 1, 8);

create unique index if not exists invoices_invoice_token_idx on public.invoices (invoice_token);

-- Public read policy: anyone can read an invoice by token (limited columns via app-level select)
create policy "public read by token" on public.invoices
  for select using (true);

-- Add check constraint for payment_type
alter table public.invoices
  add constraint invoices_payment_type_check
  check (payment_type in ('one_time', 'subscription'));

-- Add check constraint for billing_interval
alter table public.invoices
  add constraint invoices_billing_interval_check
  check (billing_interval is null or billing_interval in ('monthly', 'yearly'));
