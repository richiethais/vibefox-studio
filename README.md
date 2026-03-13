# Vibefox Studio

Marketing site, admin CRM, and client portal for Vibefox Studio.

## Stack

- React 19
- Vite
- Supabase Auth, Database, and Edge Functions
- Tailwind CSS on marketing pages
- Inline styles across admin and client portal screens

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Billing and inquiry backend

This repo now includes:

- `supabase/functions/admin-billing` for Stripe invoice and payment link creation
- `supabase/functions/submit-inquiry` for the public contact form with a 60-second rate limit
- `supabase/migrations/005_billing_and_inquiry_rate_limit.sql` to extend billing records and lock inquiry inserts behind the edge function

Required Supabase secrets for the edge functions:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAIL`
- `STRIPE_SECRET_KEY`

Deploy steps after code changes:

```bash
supabase db push
supabase functions deploy invite-client
supabase functions deploy submit-inquiry
supabase functions deploy admin-billing
```

The browser app does not store the Stripe secret. Stripe calls only happen inside Supabase Edge Functions.
