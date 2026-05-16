# Private Coaching & Consulting Page — Design

**Date:** 2026-05-16
**Status:** Approved

## Goal

Add a private, unlisted page at `/privatecoaching` that sells 1:1 AI Software Engineering coaching at $500/hour. A visitor fills out a qualification form, pays via Stripe Checkout, then lands on a thank-you page with an embedded Cal.com booking widget. The admin CRM is notified of both the inquiry and the payment.

## Privacy

- URL: `/privatecoaching` (one word, no hyphen)
- Not linked from `Nav`, `Footer`, or any other public surface
- `<meta name="robots" content="noindex, nofollow">` on the page
- Excluded from `scripts/generate-sitemap.mjs`
- Discoverability is by direct-link sharing only

## User flow

1. Visitor opens `/privatecoaching` via shared link.
2. Reads hero, what-you-get, $500/hr pricing.
3. Fills 8-field qualification form.
4. On submit: form POSTs to a new edge function that creates an inquiry row (status `pending_payment`) and a Stripe Checkout Session ($500, `mode: payment`, `metadata.inquiry_id`).
5. Browser redirects to Stripe-hosted checkout (`session.url`).
6. On payment success Stripe redirects to `/privatecoaching/thanks?session_id={CHECKOUT_SESSION_ID}`.
7. Stripe webhook (`checkout.session.completed`) flips the inquiry to `paid`, stores `stripe_session_id` + `amount_paid_cents`, emails admin, emails buyer with Cal.com link.
8. Thank-you page embeds Cal.com inline so the buyer books immediately.

## Form fields

Required: First name, Last name, Email, Reason for coaching, What you want to walk away with.
Optional: Phone, Company/role (free text with a "Student" quick-pick chip), Experience level (Beginner / Intermediate / Advanced).

All fields stored in `inquiries.metadata` (jsonb) — no schema bloat.

## Architecture

### Frontend

- New page `src/pages/marketing/PrivateCoachingPage.jsx` — hero, qualification form, "Continue to checkout" button. Styled to match existing marketing pages (Tailwind, framer-motion patterns from `PricingPage.jsx`).
- New page `src/pages/marketing/PrivateCoachingThanksPage.jsx` — confirmation copy + Cal.com inline embed pointing at `https://cal.com/vibefoxcoaching/private-coaching-consultation`.
- Routes added to `src/routes/PublicRoutes.jsx`:
  - `/privatecoaching` → `PrivateCoachingPage`
  - `/privatecoaching/thanks` → `PrivateCoachingThanksPage`
- Cal.com embed via official `@calcom/embed-react` package or simple `<iframe src="https://cal.com/vibefoxcoaching/private-coaching-consultation?embed=true">` fallback (preferred — no new dependency).
- `SEOHead` configured with `robots="noindex, nofollow"`. Verify `SEOHead` supports this prop; if not, extend it.
- `scripts/generate-sitemap.mjs` updated to exclude `/privatecoaching*` (likely already excludes anything not enumerated, but verify).

### Backend (Supabase edge functions)

- **New function: `create-coaching-checkout`** (`supabase/functions/create-coaching-checkout/index.ts`)
  - Accepts: form fields (validated server-side).
  - Server-side validation: required fields present, email format, reason length ≥ 20 chars (gentle anti-spam).
  - Reuses `inquiry_rate_limits` table — same identifier scheme as `submit-inquiry`.
  - Inserts an `inquiries` row with `form_key = 'coaching'`, `status = 'pending_payment'`, qualification data in `metadata`.
  - Calls Stripe API to create a Checkout Session:
    - `mode: 'payment'`
    - `line_items`: one $500 USD item ("1:1 AI Software Engineering Coaching — 1 hour")
    - `customer_email`: from form
    - `metadata.inquiry_id`: the new inquiry's UUID
    - `success_url`: `<site>/privatecoaching/thanks?session_id={CHECKOUT_SESSION_ID}`
    - `cancel_url`: `<site>/privatecoaching?canceled=1`
  - Returns `{ url }` to client.

- **New function: `stripe-coaching-webhook`** (`supabase/functions/stripe-coaching-webhook/index.ts`)
  - Verifies signature with `STRIPE_WEBHOOK_SECRET`.
  - Handles `checkout.session.completed`:
    - Loads `inquiry_id` from session metadata.
    - Updates inquiry: `status = 'paid'`, `stripe_session_id`, `amount_paid_cents = session.amount_total`, `paid_at = now()`.
    - Emails admin via existing `_shared/resend.ts` `notifyAdmin` helper — subject "💰 Coaching booked — $500 PAID", body includes all qualification fields.
    - Emails buyer (new helper or extend `_shared/resend.ts`) with confirmation + Cal.com booking link.
  - Idempotent: if inquiry already `paid`, skip update + skip emails.

### Schema (one migration: `008_private_coaching.sql`)

Add to `public.inquiries`:
- `status text not null default 'new'`
- `stripe_session_id text`
- `amount_paid_cents int`
- `paid_at timestamptz`

Index: `inquiries_form_key_status_idx` on `(form_key, status)` for admin filtering.

RLS: existing admin policy already covers; no new policies needed.

### Admin CRM

- Extend `src/pages/admin/Inquiries.jsx` to:
  - Show a `form_key` chip (e.g., "Coaching" badge) on each row.
  - Add a filter for `form_key` (existing form types + "coaching").
  - For coaching rows, display `status` badge (`pending_payment` / `paid`) and the qualification fields from `metadata`.
  - Link to Stripe session in dashboard when `stripe_session_id` present.

## Email content

### Admin email (on payment)
- Subject: `💰 Coaching booked — $500 PAID`
- Body: full qualification form, payment amount, Stripe session ID/link, inquiry ID

### Buyer confirmation email
- Subject: `Your coaching session is confirmed — book your time`
- Body:
  - Thanks for booking 1:1 AI Software Engineering coaching with Vibefox Studio.
  - Payment received: $500.00 USD.
  - Book your 60-min slot: `https://cal.com/vibefoxcoaching/private-coaching-consultation`
  - Reply to this email if you have questions.

## Error handling

- Form submit failure → show inline error, do not redirect.
- Stripe Checkout Session creation failure → mark inquiry status `checkout_failed`, return 500, client shows retry.
- Webhook idempotency: handle Stripe retries safely (check `status = 'paid'` before re-sending emails).
- If `/privatecoaching/thanks` is loaded without a `session_id` query param, show generic confirmation (no Cal.com? — actually still show Cal.com link, since payment may have completed and they just lost the URL).

## Secrets (Supabase Edge Function env)

- `STRIPE_SECRET_KEY` — already configured (user confirmed).
- `STRIPE_WEBHOOK_SECRET` — created during deploy step after the webhook function is live.
- `RESEND_API_KEY` — already configured.

## Out of scope

- Subscriptions / packages / multi-session discounts (single $500 one-off only).
- Refunds workflow.
- Coaching session notes / post-session deliverables in the CRM.
- A dedicated `/admin/coaching` page — reusing existing `/admin/inquiries`.
- Token-gating the URL (privacy via unlisted-URL only).

## Open items (deferred to deploy)

- Create the Stripe webhook endpoint after function deploy; capture `whsec_...` and add to Supabase secrets.
- Verify Cal.com embed URL works publicly (user to confirm the `cal.com/vibefoxcoaching/...` URL renders in incognito).
