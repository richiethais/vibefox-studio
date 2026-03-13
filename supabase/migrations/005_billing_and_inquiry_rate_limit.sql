alter table public.inquiries
  add column if not exists form_key text not null default 'contact';

drop policy if exists "public insert" on public.inquiries;

alter table public.invoices
  add column if not exists kind text not null default 'invoice',
  add column if not exists currency text not null default 'usd',
  add column if not exists stripe_invoice_id text,
  add column if not exists stripe_invoice_status text,
  add column if not exists stripe_invoice_url text,
  add column if not exists stripe_invoice_pdf text,
  add column if not exists stripe_payment_link_id text,
  add column if not exists stripe_payment_link_url text,
  add column if not exists line_items jsonb not null default '[]'::jsonb,
  add column if not exists custom_fields jsonb not null default '[]'::jsonb,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists customer_name_snapshot text,
  add column if not exists customer_email_snapshot text;

create table if not exists public.inquiry_rate_limits (
  id uuid primary key default gen_random_uuid(),
  form_key text not null,
  identifier text not null,
  email text not null,
  source_ip text,
  created_at timestamptz not null default now()
);

create index if not exists inquiry_rate_limits_identifier_created_at_idx
  on public.inquiry_rate_limits (identifier, created_at desc);

create index if not exists inquiry_rate_limits_created_at_idx
  on public.inquiry_rate_limits (created_at desc);

alter table public.inquiry_rate_limits enable row level security;

create policy "admin all" on public.inquiry_rate_limits
  for all using (auth.jwt() ->> 'email' = 'richie@vibefoxstudio.com');
