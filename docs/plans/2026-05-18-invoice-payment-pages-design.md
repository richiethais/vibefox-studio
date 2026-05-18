# Invoice Payment Pages — Design

## Goal

Add public, branded invoice pages at `/invoice/:token` where clients can view invoice details and pay via Stripe Checkout. Support both one-time and subscription (monthly/yearly) payments. The admin creates invoices from the existing CRM form and shares the link.

## Approach

Stripe Checkout Session with a branded wrapper page. The invoice page lives on vibefoxstudio.com with full branding. When the client clicks "Pay Now", a Stripe Checkout Session is created and the client is redirected to Stripe's hosted checkout. After payment, they return to the invoice page with a success state showing a receipt link.

## Database Changes

New columns on `invoices` table (migration 010):

| Column | Type | Purpose |
|--------|------|---------|
| `invoice_token` | `text UNIQUE NOT NULL` | Public URL token, 8 alphanumeric chars |
| `payment_type` | `text NOT NULL DEFAULT 'one_time'` | `one_time` or `subscription` |
| `billing_interval` | `text` | `monthly` or `yearly`, null for one-time |
| `business_name` | `text` | Optional client business name |
| `stripe_checkout_session_id` | `text` | Checkout session after client clicks Pay |
| `stripe_subscription_id` | `text` | For subscriptions |
| `paid_at` | `timestamptz` | When payment confirmed |

RLS: public SELECT policy on `invoice_token` lookup returning only safe columns (no client_id, no internal metadata). Uses a Postgres function or view to limit exposure.

Backfill: existing rows get a generated `invoice_token` via the migration.

## Admin Form Changes

Extend `AdminInvoices.jsx` create form:

- Payment type toggle: "One-time" / "Subscription"
- Billing interval selector (monthly/yearly) — visible only when subscription selected
- Business name field (optional) next to customer name
- Success response shows the public URL (`vibefoxstudio.com/invoice/{token}`) with a copy button

Invoice list table gains a "Copy link" action for the public URL.

## Public Invoice Page (`/invoice/:token`)

New public route, no auth required.

States:
1. **Loading** — spinner while fetching
2. **Not found** — invalid token
3. **Unpaid** — branded invoice with details + "Pay Now" button
4. **Processing** — after returning from Stripe, before webhook confirms
5. **Paid** — "Payment received" + Stripe receipt link

Page content:
- Vibefox Studio logo/branding
- Client name, business name (if set)
- Invoice description, line items with amounts
- Total, currency, due date
- Payment type badge (one-time / monthly / yearly subscription)
- Pay Now button (calls edge function, redirects to Stripe)

## New Edge Function: `create-invoice-checkout`

Public-facing, no admin auth. POST with `{ invoice_token }`.

1. Load invoice by token, reject if paid or not found
2. Find or create Stripe customer by email (reuse `_shared/stripe.ts` pattern)
3. Create Stripe Checkout Session:
   - One-time: `mode: 'payment'`, line items from invoice
   - Subscription: `mode: 'subscription'`, line items with `price_data.recurring.interval`
4. Store `stripe_checkout_session_id` on the invoice row
5. Return `{ url }` — the Stripe Checkout URL

Success URL: `/invoice/:token?status=success`
Cancel URL: `/invoice/:token`

## Webhook Handling

Extend or create webhook for:

- `checkout.session.completed` — match via `stripe_checkout_session_id`, mark invoice `paid`, set `paid_at`, store `stripe_subscription_id` if present
- `customer.subscription.deleted` — optional future handling for canceled subscriptions

## Not in Scope

- Email sending from the invoice page (Stripe handles receipts)
- PDF generation (Stripe receipts suffice)
- Subscription management UI (cancel/pause — future feature)
- Client portal integration for viewing invoices
