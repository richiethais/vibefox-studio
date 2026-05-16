# Private Coaching Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship an unlisted `/privatecoaching` page where visitors fill a qualification form, pay $500 via Stripe Checkout, and land on a thank-you page with an embedded Cal.com booking widget. CRM and admin email are notified on payment.

**Architecture:** New React page + thank-you page (no nav/footer links, `noindex`). Two new Supabase edge functions: `create-coaching-checkout` (validates form → creates inquiry row → creates Stripe Checkout Session → returns redirect URL) and `stripe-coaching-webhook` (verifies signature → flips inquiry to `paid` → emails admin + buyer). One schema migration adds payment-status columns to `public.inquiries`. Admin Inquiries page extended with a `form_key` filter and `status` badge.

**Tech Stack:** React 19, React Router 7, Vite, Tailwind, framer-motion, Supabase (Postgres + Edge Functions/Deno), Stripe (Checkout Sessions + webhooks), Resend (existing).

**Design doc:** `docs/2026-05-16-private-coaching-design.md`

---

## Conventions

- After each task, run `npm run lint` if frontend files changed; the edge functions are Deno (no lint runner wired up — type-check by importing and reading).
- Commit after each task using messages of the form `feat:` / `chore:` / `fix:`.
- The project is React JSX (not TypeScript). Edge functions are TypeScript (Deno).
- No automated test suite exists in this repo. "Verification" for frontend tasks = visiting the dev server and confirming the change renders + works. "Verification" for edge functions = `supabase functions serve <name>` + `curl` against the local URL. For migrations = `supabase db reset` locally or applying via Supabase dashboard.
- Cal.com booking URL: `https://cal.com/vibefoxcoaching/private-coaching-consultation`
- Site URL: `https://vibefoxstudio.com`

---

## Task 1: Schema migration — add payment columns to `inquiries`

**Files:**
- Create: `supabase/migrations/008_private_coaching.sql`

**Step 1: Write migration SQL**

```sql
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
```

**Step 2: Verify migration applies cleanly**

If Supabase CLI is wired up locally, run:
```
supabase db reset
```
Otherwise, the user will apply it via the Supabase SQL editor at deploy time. Just confirm the SQL is syntactically valid (re-read the file).

**Step 3: Commit**

```bash
git add supabase/migrations/008_private_coaching.sql
git commit -m "feat: add payment-status columns to inquiries for private coaching"
```

---

## Task 2: Edge function — `create-coaching-checkout`

**Files:**
- Create: `supabase/functions/create-coaching-checkout/index.ts`

**Reference:** `supabase/functions/submit-inquiry/index.ts` for rate-limit + inquiry-insert patterns. `supabase/functions/_shared/auth.ts` for `getSupabaseAdminClient`. `supabase/functions/_shared/cors.ts` for `corsHeaders` + `json`.

**Step 1: Implement the function**

```typescript
import { getSupabaseAdminClient } from '../_shared/auth.ts'
import { corsHeaders, json } from '../_shared/cors.ts'

const RATE_LIMIT_WINDOW_MS = 60_000
const FORM_KEY = 'coaching'
const SITE_URL = Deno.env.get('SITE_URL')?.trim() || 'https://vibefoxstudio.com'

function getSourceIp(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) return forwardedFor.split(',')[0]?.trim() || null
  return request.headers.get('x-real-ip')?.trim() || request.headers.get('cf-connecting-ip')?.trim() || null
}

function badRequest(message: string, status = 400) {
  return json({ error: message }, status)
}

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return badRequest('Method not allowed.', 405)

  try {
    const supabaseAdmin = getSupabaseAdminClient()
    const body = await request.json()

    const firstName = cleanText(body.first_name)
    const lastName = cleanText(body.last_name)
    const email = cleanText(body.email).toLowerCase()
    const phone = cleanText(body.phone)
    const companyRole = cleanText(body.company_role)
    const experienceLevel = cleanText(body.experience_level)
    const reason = cleanText(body.reason)
    const outcome = cleanText(body.outcome)
    const sourceIp = getSourceIp(request)

    if (!firstName) return badRequest('First name is required.')
    if (!lastName) return badRequest('Last name is required.')
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return badRequest('A valid email is required.')
    if (!reason || reason.length < 20) return badRequest('Please share at least a couple sentences about what you want coaching on.')
    if (!outcome || outcome.length < 10) return badRequest('Please share what you want to walk away with.')

    const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')?.trim()
    if (!stripeSecret) return json({ error: 'Stripe is not configured.' }, 500)

    // Rate limit (reuse existing table)
    const identifier = `${FORM_KEY}:${email}:${sourceIp || 'unknown'}`
    const windowStartIso = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString()

    const { data: existingRateLimit, error: rateLimitError } = await supabaseAdmin
      .from('inquiry_rate_limits')
      .select('created_at')
      .eq('identifier', identifier)
      .gte('created_at', windowStartIso)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (rateLimitError) return json({ error: rateLimitError.message }, 500)
    if (existingRateLimit?.created_at) {
      return json({ error: 'Please wait a moment before trying again.' }, 429)
    }

    const name = `${firstName} ${lastName}`.trim()
    const metadata = {
      first_name: firstName,
      last_name: lastName,
      phone: phone || null,
      company_role: companyRole || null,
      experience_level: experienceLevel || null,
      reason,
      outcome,
    }

    const { data: inquiry, error: inquiryError } = await supabaseAdmin
      .from('inquiries')
      .insert({
        form_key: FORM_KEY,
        status: 'pending_payment',
        email,
        name,
        service_type: 'coaching',
        budget: '$500',
        message: reason,
        metadata,
      })
      .select('id')
      .single()

    if (inquiryError) return json({ error: inquiryError.message }, 500)

    await supabaseAdmin.from('inquiry_rate_limits').insert({
      email,
      form_key: FORM_KEY,
      identifier,
      source_ip: sourceIp,
    })

    // Create Stripe Checkout Session
    const stripeParams = new URLSearchParams()
    stripeParams.append('mode', 'payment')
    stripeParams.append('customer_email', email)
    stripeParams.append('success_url', `${SITE_URL}/privatecoaching/thanks?session_id={CHECKOUT_SESSION_ID}`)
    stripeParams.append('cancel_url', `${SITE_URL}/privatecoaching?canceled=1`)
    stripeParams.append('line_items[0][price_data][currency]', 'usd')
    stripeParams.append('line_items[0][price_data][unit_amount]', '50000')
    stripeParams.append('line_items[0][price_data][product_data][name]', '1:1 AI Software Engineering Coaching — 1 hour')
    stripeParams.append('line_items[0][price_data][product_data][description]', 'Private 60-minute coaching session with Vibefox Studio')
    stripeParams.append('line_items[0][quantity]', '1')
    stripeParams.append('metadata[inquiry_id]', inquiry.id)
    stripeParams.append('payment_intent_data[metadata][inquiry_id]', inquiry.id)

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecret}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: stripeParams.toString(),
    })

    if (!stripeRes.ok) {
      const errText = await stripeRes.text()
      console.error('stripe checkout error', errText)
      await supabaseAdmin
        .from('inquiries')
        .update({ status: 'checkout_failed' })
        .eq('id', inquiry.id)
      return json({ error: 'Could not start checkout. Try again.' }, 500)
    }

    const session = await stripeRes.json() as { id: string; url: string }

    await supabaseAdmin
      .from('inquiries')
      .update({ stripe_session_id: session.id })
      .eq('id', inquiry.id)

    return json({ url: session.url, inquiry_id: inquiry.id })
  } catch (error) {
    console.error('create-coaching-checkout', error)
    return json({ error: error instanceof Error ? error.message : 'Unexpected error.' }, 500)
  }
})
```

**Step 2: Verify the file parses**

Open the file and confirm no syntax errors. (No type-check runner is wired locally; this matches the pattern of the other edge functions in the repo.)

**Step 3: Commit**

```bash
git add supabase/functions/create-coaching-checkout/index.ts
git commit -m "feat: add create-coaching-checkout edge function"
```

---

## Task 3: Extend `_shared/resend.ts` to support arbitrary `to`

**Files:**
- Modify: `supabase/functions/_shared/resend.ts`

The current `notifyAdmin` always sends to the admin. We need a generic `sendEmail` so we can also email the buyer.

**Step 1: Add `sendEmail` helper**

Add this export to `supabase/functions/_shared/resend.ts` (do not change `notifyAdmin` — refactor it to call `sendEmail` internally to avoid duplication):

```typescript
interface SendEmailParams {
  to: string
  subject: string
  html: string
  from?: string
  replyTo?: string
}

export async function sendEmail(params: SendEmailParams): Promise<string | null> {
  const resendKey = Deno.env.get('RESEND_API_KEY')?.trim()

  if (!resendKey) {
    const warning = 'RESEND_API_KEY not set — email send skipped.'
    console.warn('sendEmail', warning)
    return warning
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: params.from ?? 'VibeFox Studio <notifications@vibefoxstudio.com>',
        to: params.to,
        subject: params.subject,
        html: params.html,
        ...(params.replyTo ? { reply_to: params.replyTo } : {}),
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      const warning = `Resend error (${res.status}): ${text}`
      console.error('sendEmail', warning)
      return warning
    }

    return null
  } catch (error) {
    const warning = error instanceof Error ? error.message : 'Email send failed.'
    console.error('sendEmail', { message: warning })
    return warning
  }
}
```

Then refactor `notifyAdmin` to delegate:

```typescript
export async function notifyAdmin(params: NotifyAdminParams): Promise<string | null> {
  const adminEmail = getAdminEmail()
  return sendEmail({ to: adminEmail, subject: params.subject, html: params.html, from: params.from })
}
```

**Step 2: Verify other callers still work**

Confirm `submit-inquiry`, `submit-support`, and `notify-message` still import `notifyAdmin` (unchanged signature). They should still build.

**Step 3: Commit**

```bash
git add supabase/functions/_shared/resend.ts
git commit -m "refactor: extract sendEmail helper from notifyAdmin"
```

---

## Task 4: Edge function — `stripe-coaching-webhook`

**Files:**
- Create: `supabase/functions/stripe-coaching-webhook/index.ts`

**Step 1: Implement the function**

```typescript
import { getSupabaseAdminClient } from '../_shared/auth.ts'
import { notifyAdmin, sendEmail, buildNotificationHtml } from '../_shared/resend.ts'

const CAL_LINK = 'https://cal.com/vibefoxcoaching/private-coaching-consultation'

async function verifyStripeSignature(
  payload: string,
  signature: string | null,
  secret: string,
): Promise<boolean> {
  if (!signature) return false

  // Stripe signature header: "t=timestamp,v1=hash,..."
  const parts = Object.fromEntries(
    signature.split(',').map(part => {
      const [key, value] = part.split('=')
      return [key, value]
    }),
  )
  const timestamp = parts.t
  const expected = parts.v1
  if (!timestamp || !expected) return false

  const signedPayload = `${timestamp}.${payload}`
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sigBytes = await crypto.subtle.sign('HMAC', key, enc.encode(signedPayload))
  const computed = Array.from(new Uint8Array(sigBytes))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  // Constant-time compare
  if (computed.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < computed.length; i++) diff |= computed.charCodeAt(i) ^ expected.charCodeAt(i)
  return diff === 0
}

function buyerEmailHtml(firstName: string) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #111;">Payment confirmed — let's get you on the calendar</h2>
      <p>Hi ${firstName || 'there'},</p>
      <p>Thanks for booking a 1:1 AI Software Engineering coaching session with Vibefox Studio. Your $500 payment was received.</p>
      <p>Pick a 60-minute slot here:</p>
      <p>
        <a href="${CAL_LINK}" style="display: inline-block; padding: 12px 20px; background: #111; color: #fff; text-decoration: none; border-radius: 8px;">
          Book your coaching session
        </a>
      </p>
      <p>Or paste this link in your browser: <a href="${CAL_LINK}">${CAL_LINK}</a></p>
      <p>If you have questions before the session, just reply to this email.</p>
      <p>— Richie, Vibefox Studio</p>
    </div>
  `
}

Deno.serve(async request => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')?.trim()
  if (!webhookSecret) return new Response('Webhook secret not configured', { status: 500 })

  const signature = request.headers.get('stripe-signature')
  const payload = await request.text()

  const verified = await verifyStripeSignature(payload, signature, webhookSecret)
  if (!verified) return new Response('Invalid signature', { status: 400 })

  let event: { type: string; data: { object: Record<string, unknown> } }
  try {
    event = JSON.parse(payload)
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return new Response('Event ignored', { status: 200 })
  }

  const session = event.data.object as {
    id: string
    metadata?: Record<string, string>
    amount_total?: number
    customer_email?: string
    customer_details?: { email?: string }
  }

  const inquiryId = session.metadata?.inquiry_id
  if (!inquiryId) {
    console.warn('checkout.session.completed missing inquiry_id', session.id)
    return new Response('Missing inquiry_id metadata', { status: 200 })
  }

  const supabaseAdmin = getSupabaseAdminClient()

  const { data: inquiry, error: loadError } = await supabaseAdmin
    .from('inquiries')
    .select('id, status, email, name, metadata')
    .eq('id', inquiryId)
    .maybeSingle()

  if (loadError || !inquiry) {
    console.error('webhook: inquiry not found', inquiryId, loadError)
    return new Response('Inquiry not found', { status: 200 })
  }

  // Idempotency — Stripe retries; only process once
  if (inquiry.status === 'paid') {
    return new Response('Already processed', { status: 200 })
  }

  const { error: updateError } = await supabaseAdmin
    .from('inquiries')
    .update({
      status: 'paid',
      amount_paid_cents: session.amount_total ?? 50000,
      paid_at: new Date().toISOString(),
    })
    .eq('id', inquiryId)

  if (updateError) {
    console.error('webhook: update failed', updateError)
    return new Response('Update failed', { status: 500 })
  }

  const meta = (inquiry.metadata || {}) as Record<string, string | null>
  const buyerEmail = inquiry.email || session.customer_email || session.customer_details?.email || ''

  // Admin notification
  await notifyAdmin({
    subject: `💰 Coaching booked — $500 PAID — ${inquiry.name}`,
    html: buildNotificationHtml({
      'Name': inquiry.name || '—',
      'Email': inquiry.email || '—',
      'Phone': meta.phone || '—',
      'Company / role': meta.company_role || '—',
      'Experience': meta.experience_level || '—',
      'Reason': meta.reason || '—',
      'Desired outcome': meta.outcome || '—',
      'Amount paid': `$${((session.amount_total ?? 50000) / 100).toFixed(2)}`,
      'Stripe session': session.id,
    }),
  })

  // Buyer confirmation
  if (buyerEmail) {
    await sendEmail({
      to: buyerEmail,
      subject: 'Your Vibefox coaching session is confirmed — book your time',
      html: buyerEmailHtml(meta.first_name || ''),
      replyTo: 'richiethais@gmail.com',
    })
  }

  return new Response('ok', { status: 200 })
})
```

**Step 2: Verify file parses cleanly**

Open the file, re-read, confirm syntax.

**Step 3: Commit**

```bash
git add supabase/functions/stripe-coaching-webhook/index.ts
git commit -m "feat: add stripe-coaching-webhook edge function"
```

---

## Task 5: Frontend — `PrivateCoachingPage`

**Files:**
- Create: `src/pages/marketing/PrivateCoachingPage.jsx`
- Modify: `src/routes/PublicRoutes.jsx`

**Step 1: Look at existing marketing page conventions**

Re-read `src/pages/marketing/PricingPage.jsx` and `src/pages/marketing/ContactPage.jsx` for layout/style patterns (Tailwind classes, framer-motion usage, `SEOHead` usage, `Nav` + `Footer` import patterns).

**Step 2: Implement the page**

```jsx
// src/pages/marketing/PrivateCoachingPage.jsx
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Nav from '../../components/Nav'
import { Footer } from '../../components/CTAFooter'
import SEOHead from '../../components/SEOHead'
import { supabase } from '../../lib/supabaseClient' // verify path

const SUPABASE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-coaching-checkout`

const ROLE_SUGGESTIONS = ['Student', 'Freelancer', 'Founder', 'Engineer', 'Designer']
const EXPERIENCE_LEVELS = ['Beginner', 'Intermediate', 'Advanced']

export default function PrivateCoachingPage() {
  const [params] = useSearchParams()
  const wasCanceled = params.get('canceled') === '1'

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company_role: '',
    experience_level: '',
    reason: '',
    outcome: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch(SUPABASE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not start checkout.')
      window.location.href = data.url
    } catch (err) {
      setError(err.message || 'Something went wrong.')
      setSubmitting(false)
    }
  }

  return (
    <>
      <SEOHead
        title="Private Coaching & Consulting — Vibefox Studio"
        description="1:1 AI Software Engineering coaching with Vibefox Studio."
        path="/privatecoaching"
        noindex
      />
      <Nav />
      <main className="mx-auto max-w-3xl px-6 pt-32 pb-24">
        <header className="mb-12 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-wider text-orange-500">Private</p>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            1:1 AI Software Engineering Coaching
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-600">
            One hour, one-on-one. Bring your code, your stack, your roadblocks. Walk away unstuck.
          </p>
          <p className="mt-6 text-2xl font-semibold text-slate-900">$500 / hour</p>
        </header>

        <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-8">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">What you get</h2>
          <ul className="space-y-2 text-slate-700">
            <li>• 60 minutes of focused 1:1 coaching with Richie (Vibefox Studio)</li>
            <li>• Live code review, architecture feedback, or pair-programming on your real project</li>
            <li>• Concrete next steps you can act on the same week</li>
            <li>• Follow-up notes in writing</li>
          </ul>
        </section>

        {wasCanceled && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Checkout was canceled. Your information is still here — you can resubmit anytime.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-8">
          <h2 className="text-xl font-semibold text-slate-900">Tell me about you</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" required value={form.first_name} onChange={update('first_name')} />
            <Field label="Last name" required value={form.last_name} onChange={update('last_name')} />
          </div>

          <Field type="email" label="Email" required value={form.email} onChange={update('email')} />
          <Field label="Phone (optional)" value={form.phone} onChange={update('phone')} />

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Company or role</label>
            <input
              type="text"
              value={form.company_role}
              onChange={update('company_role')}
              placeholder="e.g. Founder at Acme, Student at NYU…"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {ROLE_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, company_role: s }))}
                  className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-600 hover:border-orange-500 hover:text-orange-600"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Experience level</label>
            <div className="flex flex-wrap gap-2">
              {EXPERIENCE_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, experience_level: level }))}
                  className={`rounded-full border px-4 py-1.5 text-sm transition ${
                    form.experience_level === level
                      ? 'border-orange-500 bg-orange-500 text-white'
                      : 'border-slate-300 text-slate-700 hover:border-orange-500'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              What do you want coaching on? <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={form.reason}
              onChange={update('reason')}
              placeholder="The project, the stack, the specific problems you're stuck on…"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              What do you want to walk away with? <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={form.outcome}
              onChange={update('outcome')}
              placeholder="A clearer architecture, a working feature, a decision made…"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-slate-900 px-6 py-3 text-base font-semibold text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Starting checkout…' : 'Continue to checkout — $500'}
          </button>

          <p className="text-center text-xs text-slate-500">
            Secure payment via Stripe. You'll receive a confirmation email with your booking link.
          </p>
        </form>
      </main>
      <Footer />
    </>
  )
}

function Field({ label, type = 'text', required = false, value, onChange }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
      />
    </div>
  )
}
```

**Step 3: Add route**

Modify `src/routes/PublicRoutes.jsx`:

```jsx
import PrivateCoachingPage from '../pages/marketing/PrivateCoachingPage.jsx'
// ...inside <PublicRoutes />:
<Route path="/privatecoaching" element={<PrivateCoachingPage />} />
```

**Step 4: Verify**

- Confirm `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` env vars exist (grep src for `VITE_SUPABASE`).
- Confirm the supabase client import path used elsewhere in the project; if `../lib/supabaseClient` doesn't exist, remove the import (we don't actually use it in this file since we hit the function URL directly).
- Run `npm run dev`, open `http://localhost:5173/privatecoaching`, confirm the page renders. Open DevTools console — no errors. (Note: clicking Submit will fail until the edge function is deployed; that's expected at this stage.)
- Run `npm run lint`.

**Step 5: Commit**

```bash
git add src/pages/marketing/PrivateCoachingPage.jsx src/routes/PublicRoutes.jsx
git commit -m "feat: add unlisted /privatecoaching qualification page"
```

---

## Task 6: Frontend — thank-you page with Cal.com embed

**Files:**
- Create: `src/pages/marketing/PrivateCoachingThanksPage.jsx`
- Modify: `src/routes/PublicRoutes.jsx`

**Step 1: Implement the page**

```jsx
// src/pages/marketing/PrivateCoachingThanksPage.jsx
import { useSearchParams } from 'react-router-dom'
import Nav from '../../components/Nav'
import { Footer } from '../../components/CTAFooter'
import SEOHead from '../../components/SEOHead'

const CAL_LINK = 'https://cal.com/vibefoxcoaching/private-coaching-consultation'

export default function PrivateCoachingThanksPage() {
  const [params] = useSearchParams()
  const sessionId = params.get('session_id')

  return (
    <>
      <SEOHead
        title="Coaching confirmed — book your session"
        description="Your coaching payment was received. Pick a time on the calendar."
        path="/privatecoaching/thanks"
        noindex
      />
      <Nav />
      <main className="mx-auto max-w-4xl px-6 pt-32 pb-24">
        <header className="mb-10 text-center">
          <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Payment confirmed
          </h1>
          <p className="mx-auto max-w-xl text-lg text-slate-600">
            Pick a 60-minute slot below. You'll also get a confirmation email with this link.
          </p>
          {sessionId && (
            <p className="mt-2 text-xs text-slate-400">Reference: {sessionId.slice(-12)}</p>
          )}
        </header>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <iframe
            src={`${CAL_LINK}?embed=true`}
            title="Book your coaching session"
            className="h-[750px] w-full border-0"
          />
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Calendar not loading? Book here directly:{' '}
          <a href={CAL_LINK} className="text-orange-600 underline">
            {CAL_LINK}
          </a>
        </p>
      </main>
      <Footer />
    </>
  )
}
```

**Step 2: Add route**

Add to `src/routes/PublicRoutes.jsx`:

```jsx
import PrivateCoachingThanksPage from '../pages/marketing/PrivateCoachingThanksPage.jsx'
// ...
<Route path="/privatecoaching/thanks" element={<PrivateCoachingThanksPage />} />
```

**Step 3: Verify**

- `npm run dev`, open `http://localhost:5173/privatecoaching/thanks`, confirm Cal.com iframe loads and the booking widget renders.
- If Cal.com iframe is blocked by CSP/frame-ancestors, fall back to a prominent `<a>` button to `CAL_LINK` and remove the iframe.
- Run `npm run lint`.

**Step 4: Commit**

```bash
git add src/pages/marketing/PrivateCoachingThanksPage.jsx src/routes/PublicRoutes.jsx
git commit -m "feat: add private coaching thank-you page with Cal.com embed"
```

---

## Task 7: Admin CRM — show coaching inquiries clearly

**Files:**
- Modify: `src/pages/admin/Inquiries.jsx`

**Step 1: Read the file**

Open `src/pages/admin/Inquiries.jsx` and locate:
- Where inquiries are listed (likely a `<table>` or card grid).
- Whether there's existing filter UI by `form_key`.

**Step 2: Add status badge + form_key chip**

For each inquiry row, render:
- A small chip showing `form_key` (`contact` / `coaching` / etc.). Style coaching rows with an accent color.
- For `form_key === 'coaching'`: a `status` badge — colors:
  - `pending_payment` → amber
  - `paid` → green (use existing `BILLING_STATUS_COLORS.paid` from `src/lib/billing.js` if practical)
  - `checkout_failed` → red
- For coaching rows, when expanded/clicked: show the full `metadata` (phone, company_role, experience_level, reason, outcome) and `amount_paid_cents` / `paid_at` if set.
- If `stripe_session_id` is set: link to `https://dashboard.stripe.com/payments/<stripe_session_id>` (note: Stripe's dashboard link for sessions is `https://dashboard.stripe.com/checkout/sessions/<id>` — use that).

**Step 3: Add a `form_key` filter**

Add a filter dropdown or chip group above the inquiry list: `All` / `Contact` / `Coaching` (+ any other existing form keys). Filter the rendered list client-side by `form_key`.

**Step 4: Verify**

- `npm run dev`, log in to admin, open `/admin/inquiries`. With no coaching inquiries yet, confirm the filter UI renders and existing inquiries still show normally.
- Insert a fake coaching row via Supabase SQL editor to test the badge/expand UI:
  ```sql
  insert into public.inquiries (form_key, status, email, name, service_type, budget, message, metadata)
  values ('coaching', 'paid', 'test@example.com', 'Test User', 'coaching', '$500', 'Testing the CRM render', '{"first_name":"Test","last_name":"User","phone":"555","company_role":"Student","experience_level":"Beginner","reason":"Test reason","outcome":"Test outcome"}');
  ```
- Confirm the row shows the green "paid" badge, the coaching chip, and expanded metadata.
- Delete the test row when done.
- Run `npm run lint`.

**Step 5: Commit**

```bash
git add src/pages/admin/Inquiries.jsx
git commit -m "feat: surface coaching inquiries with status badges in admin CRM"
```

---

## Task 8: Sitemap — confirm `/privatecoaching` is excluded

**Files:**
- Inspect: `scripts/generate-sitemap.mjs`

**Step 1: Verify**

Re-read `scripts/generate-sitemap.mjs`. The script uses an explicit `staticRoutes` allowlist + blog/city auto-generation. Since `/privatecoaching` is not in `staticRoutes`, and is not a blog or city, **it will already be excluded automatically.** No change needed.

**Step 2: Confirm by running the generator**

```bash
node scripts/generate-sitemap.mjs
grep privatecoaching public/sitemap.xml || echo "Confirmed: /privatecoaching is NOT in sitemap.xml"
```

Expected output: `Confirmed: /privatecoaching is NOT in sitemap.xml`

**Step 3: No commit needed** unless `public/sitemap.xml` regenerated with unrelated changes — if it did, revert those changes.

---

## Task 9: Final manual smoke test (pre-deploy)

**Step 1: End-to-end local check**

- `npm run dev`
- Visit `http://localhost:5173/privatecoaching` — page renders, form looks right.
- Visit `http://localhost:5173/privatecoaching/thanks` — Cal.com iframe loads.
- Visit `http://localhost:5173/` — confirm `/privatecoaching` is NOT linked from nav or footer.
- View page source on `/privatecoaching` — confirm `<meta name="robots" content="noindex,nofollow">`.

**Step 2: Lint + build**

```bash
npm run lint
npm run build
```

Both should pass cleanly.

**Step 3: Commit any final cleanup**

If lint/build surfaced issues, fix them and commit:

```bash
git commit -am "chore: lint/build cleanup for private coaching feature"
```

---

## Deploy notes (for the user — not steps for Claude)

Once code is merged, the user (Richie) needs to:

1. **Apply migration `008_private_coaching.sql`** via Supabase dashboard SQL editor (or `supabase db push`).
2. **Deploy edge functions:**
   ```
   supabase functions deploy create-coaching-checkout
   supabase functions deploy stripe-coaching-webhook
   ```
3. **Confirm Supabase secrets** include `STRIPE_SECRET_KEY` (already exists, user confirmed), `RESEND_API_KEY` (already exists), `SITE_URL` (optional, defaults to `https://vibefoxstudio.com`).
4. **Create Stripe webhook** at https://dashboard.stripe.com/webhooks:
   - Endpoint URL: `https://<project-ref>.supabase.co/functions/v1/stripe-coaching-webhook`
   - Events: `checkout.session.completed`
   - Copy the `whsec_...` signing secret → add to Supabase secrets as `STRIPE_WEBHOOK_SECRET`.
5. **Do a $500 live test purchase** (or test-mode purchase first by temporarily swapping in `sk_test_...`):
   - Open `/privatecoaching`, fill form, submit.
   - Land on Stripe checkout, complete payment.
   - Land on `/privatecoaching/thanks`, Cal.com loads.
   - Inbox: confirm admin email + buyer email both arrive.
   - `/admin/inquiries`: confirm row shows `paid` badge with correct details.
6. **Refund the test purchase** in Stripe dashboard.
