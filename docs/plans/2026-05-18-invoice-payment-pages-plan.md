# Invoice Payment Pages — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add branded public invoice pages at `/invoice/:token` with Stripe Checkout for one-time and subscription payments, plus admin form updates for creating them.

**Architecture:** New DB columns on `invoices` table for token/payment type/subscription fields. New public-facing edge function `create-invoice-checkout` creates Stripe Checkout Sessions. A new webhook `stripe-invoice-webhook` handles `checkout.session.completed`. Public React page at `/invoice/:token` shows branded invoice details + Pay Now button.

**Tech Stack:** React 19, react-router-dom 7, Vite 7, Supabase (Postgres + Deno Edge Functions), Stripe API (npm:stripe@20.4.1), inline CSS styles (matching existing admin/marketing patterns)

---

### Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/010_invoice_payment_pages.sql`

**Step 1: Write the migration**

```sql
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
```

**Step 2: Apply the migration**

Run via Supabase MCP tool `apply_migration` with name `invoice_payment_pages` and the SQL above.

**Step 3: Commit**

```bash
git add supabase/migrations/010_invoice_payment_pages.sql
git commit -m "feat: add invoice token and payment type columns (migration 010)"
```

---

### Task 2: Update billing helpers

**Files:**
- Modify: `src/lib/billing.js`

**Step 1: Add new constants and helpers**

Add to `src/lib/billing.js`:

```js
export const PAYMENT_TYPE_LABELS = {
  one_time: 'One-time',
  subscription: 'Subscription',
}

export const BILLING_INTERVAL_LABELS = {
  monthly: 'Monthly',
  yearly: 'Yearly',
}

export function getPublicInvoiceUrl(invoice) {
  if (!invoice?.invoice_token) return ''
  return `${window.location.origin}/invoice/${invoice.invoice_token}`
}
```

**Step 2: Commit**

```bash
git add src/lib/billing.js
git commit -m "feat: add payment type labels and public invoice URL helper"
```

---

### Task 3: Update admin-billing edge function

**Files:**
- Modify: `supabase/functions/admin-billing/index.ts`

**Step 1: Add token generation helper**

Add near the top of the file (after the existing helpers):

```ts
function generateInvoiceToken() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, b => chars[b % chars.length]).join('')
}
```

**Step 2: Add payment_type and billing_interval validation**

Add after the existing `sanitizeCustomFields` function:

```ts
function sanitizePaymentType(value: unknown) {
  const cleaned = cleanText(value)
  if (cleaned === 'subscription') return 'subscription'
  return 'one_time'
}

function sanitizeBillingInterval(value: unknown) {
  const cleaned = cleanText(value)
  if (cleaned === 'yearly') return 'yearly'
  if (cleaned === 'monthly') return 'monthly'
  return null
}
```

**Step 3: Update invoiceRowPayload in the main handler**

In the section where `invoiceRowPayload` is built (around line 266), add:

```ts
const paymentType = sanitizePaymentType(body.payment_type)
const billingInterval = paymentType === 'subscription' ? sanitizeBillingInterval(body.billing_interval) || 'monthly' : null
const businessName = cleanText(body.business_name) || null
```

Add these to `invoiceRowPayload`:

```ts
billing_interval: billingInterval,
business_name: businessName,
invoice_token: generateInvoiceToken(),
payment_type: paymentType,
```

**Step 4: Include invoice_token in response URLs**

After the payment link insert (around line 320), add `publicUrl` to the response:

```ts
return json({
  billingRecord: invoiceRow,
  kind: 'payment_link',
  publicUrl: invoiceRow?.invoice_token ? `/invoice/${invoiceRow.invoice_token}` : null,
  url: paymentLink.url,
})
```

Similarly for the invoice response (around line 407):

```ts
return json({
  billingRecord: invoiceRow,
  invoicePdf: deliveredInvoice.invoice_pdf,
  kind: 'invoice',
  publicUrl: invoiceRow?.invoice_token ? `/invoice/${invoiceRow.invoice_token}` : null,
  status: stripeStatus,
  url: deliveredInvoice.hosted_invoice_url,
  warning: deliveryWarning,
})
```

**Step 5: Deploy the edge function**

Deploy via Supabase MCP or `supabase functions deploy admin-billing`.

**Step 6: Commit**

```bash
git add supabase/functions/admin-billing/index.ts
git commit -m "feat: generate invoice tokens and support payment type in admin-billing"
```

---

### Task 4: Update AdminInvoices form

**Files:**
- Modify: `src/pages/admin/Invoices.jsx`

**Step 1: Add payment type and business name to createBillingForm**

Update `createBillingForm` function to include:

```js
billing_interval: 'monthly',
business_name: '',
payment_type: 'one_time',
```

**Step 2: Add payment type toggle to the create modal**

After the Currency selector in the grid, add a payment type selector row:

```jsx
<div style={{ display: 'grid', gap: 12, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
  <div>
    <Label>Payment type</Label>
    <select value={billingForm.payment_type} onChange={setBillingField('payment_type')} style={inp}>
      <option value="one_time">One-time payment</option>
      <option value="subscription">Subscription</option>
    </select>
  </div>
  {billingForm.payment_type === 'subscription' && (
    <div>
      <Label>Billing interval</Label>
      <select value={billingForm.billing_interval} onChange={setBillingField('billing_interval')} style={inp}>
        <option value="monthly">Monthly</option>
        <option value="yearly">Yearly</option>
      </select>
    </div>
  )}
</div>
```

**Step 3: Add business name field**

In the customer info grid (the 3-column grid with name/email/phone), change it to a 4-column grid and add business name:

```jsx
<div>
  <Label>Business name</Label>
  <input
    placeholder="Optional"
    style={inp}
    value={billingForm.business_name}
    onChange={setBillingField('business_name')}
  />
</div>
```

**Step 4: Pass new fields in submitBilling**

In the `submitBilling` function body payload, add:

```js
billing_interval: billingForm.billing_interval,
business_name: billingForm.business_name.trim(),
payment_type: billingForm.payment_type,
```

**Step 5: Show public invoice URL in success notice**

Update the success notice in `submitBilling` to show the public URL:

```js
const publicUrl = data?.publicUrl
  ? `${window.location.origin}${data.publicUrl}`
  : ''

setNotice({
  actionHref: publicUrl || data?.url || '',
  actionLabel: publicUrl ? 'Copy invoice link' : (billingForm.kind === 'payment_link' ? 'Open payment link' : 'Open invoice'),
  type: 'success',
  text: data?.warning
    ? `Invoice created. Warning: ${data.warning}`
    : billingForm.kind === 'payment_link'
      ? 'Payment link created.'
      : 'Invoice created.',
})
```

**Step 6: Add "Copy link" button to the invoices table**

In the table row actions area (around line 585), add a copy link button before the existing action buttons:

```jsx
{invoice.invoice_token && (
  <button
    onClick={() => {
      navigator.clipboard.writeText(`${window.location.origin}/invoice/${invoice.invoice_token}`)
      setNotice({ type: 'success', text: 'Invoice link copied.' })
    }}
    style={ghostBtn}
  >
    Copy link
  </button>
)}
```

**Step 7: Add payment type badge to the table**

The table already shows "Type" column with kind. Update the Type cell to also show payment type:

```jsx
<td style={{ padding: '12px 16px' }}>
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <span style={{ ...badge, background: '#f3f4f6', color: '#4b5563' }}>
      {BILLING_KIND_LABELS[invoice.kind] || 'Invoice'}
    </span>
    {invoice.payment_type === 'subscription' && (
      <span style={{ ...badge, background: '#ede9fe', color: '#7c3aed' }}>
        {invoice.billing_interval === 'yearly' ? 'Yearly' : 'Monthly'}
      </span>
    )}
  </div>
</td>
```

**Step 8: Commit**

```bash
git add src/pages/admin/Invoices.jsx
git commit -m "feat: add payment type, billing interval, and copy link to admin invoices"
```

---

### Task 5: Create `create-invoice-checkout` edge function

**Files:**
- Create: `supabase/functions/create-invoice-checkout/index.ts`

**Step 1: Write the edge function**

This is public-facing (no admin auth). It takes an `invoice_token`, loads the invoice, creates a Stripe Checkout Session, and returns the checkout URL.

```ts
import { getSupabaseAdminClient } from '../_shared/auth.ts'
import { corsHeaders, json } from '../_shared/cors.ts'
import { getStripeClient } from '../_shared/stripe.ts'

const DEFAULT_SITE_URL = 'https://vibefoxstudio.com'

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeBaseUrl(value: unknown) {
  const candidate = cleanText(value)
  if (!candidate) return ''
  try {
    const url = new URL(candidate)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return ''
    return url.origin.replace(/\/+$/, '')
  } catch {
    return ''
  }
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405)

  let stage = 'request start'

  try {
    stage = 'parse request body'
    const body = await request.json().catch(() => ({}))
    const invoiceToken = cleanText(body.invoice_token)

    if (!invoiceToken) return json({ error: 'Invoice token is required.' }, 400)

    stage = 'load invoice'
    const supabaseAdmin = getSupabaseAdminClient()
    const { data: invoice, error: loadError } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('invoice_token', invoiceToken)
      .single()

    if (loadError || !invoice) {
      return json({ error: 'Invoice not found.' }, 404)
    }

    if (invoice.status === 'paid' || invoice.paid_at) {
      return json({ error: 'This invoice has already been paid.' }, 400)
    }

    const siteUrl = normalizeBaseUrl(request.headers.get('origin')) ||
      normalizeBaseUrl(Deno.env.get('SITE_URL')) ||
      DEFAULT_SITE_URL

    stage = 'initialize stripe'
    const stripe = getStripeClient()

    const customerEmail = invoice.customer_email_snapshot || ''
    const customerName = invoice.customer_name_snapshot || ''
    const lineItems = Array.isArray(invoice.line_items) ? invoice.line_items : []
    const currency = invoice.currency || 'usd'
    const isSubscription = invoice.payment_type === 'subscription'
    const interval = invoice.billing_interval || 'monthly'

    if (lineItems.length === 0) {
      return json({ error: 'This invoice has no line items.' }, 400)
    }

    stage = 'create stripe checkout session'
    const stripeLineItems = lineItems.map((item: { name?: string; description?: string; amount?: number; quantity?: number }) => {
      const priceData: Record<string, unknown> = {
        currency,
        product_data: {
          name: item.name || 'Payment',
          ...(item.description ? { description: item.description } : {}),
        },
        unit_amount: item.amount ?? 0,
      }

      if (isSubscription) {
        priceData.recurring = { interval }
      }

      return {
        price_data: priceData,
        quantity: item.quantity || 1,
      }
    })

    const sessionParams: Record<string, unknown> = {
      cancel_url: `${siteUrl}/invoice/${invoiceToken}`,
      line_items: stripeLineItems,
      metadata: {
        invoice_id: invoice.id,
        invoice_token: invoiceToken,
      },
      mode: isSubscription ? 'subscription' : 'payment',
      success_url: `${siteUrl}/invoice/${invoiceToken}?status=success&session_id={CHECKOUT_SESSION_ID}`,
    }

    if (customerEmail) {
      sessionParams.customer_email = customerEmail
    }

    if (!isSubscription) {
      sessionParams.payment_intent_data = {
        metadata: {
          invoice_id: invoice.id,
          invoice_token: invoiceToken,
        },
      }
    } else {
      sessionParams.subscription_data = {
        metadata: {
          invoice_id: invoice.id,
          invoice_token: invoiceToken,
        },
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams as any, {
      idempotencyKey: `invoice-checkout-${invoice.id}-${Date.now()}`,
    })

    if (!session?.id || !session?.url) {
      return json({ error: 'Could not create checkout session.' }, 500)
    }

    stage = 'persist checkout session id'
    await supabaseAdmin
      .from('invoices')
      .update({ stripe_checkout_session_id: session.id })
      .eq('id', invoice.id)

    return json({ url: session.url })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error.'
    console.error('create-invoice-checkout error', { stage, message })
    return json({ error: message, stage }, 500)
  }
})
```

**Step 2: Deploy the edge function**

Deploy via Supabase MCP or `supabase functions deploy create-invoice-checkout`.

**Step 3: Commit**

```bash
git add supabase/functions/create-invoice-checkout/index.ts
git commit -m "feat: add create-invoice-checkout edge function for public payments"
```

---

### Task 6: Create `stripe-invoice-webhook` edge function

**Files:**
- Create: `supabase/functions/stripe-invoice-webhook/index.ts`

**Step 1: Write the webhook handler**

Follows the same signature verification pattern as `stripe-coaching-webhook/index.ts`. Handles `checkout.session.completed` to mark invoices as paid.

```ts
import { getSupabaseAdminClient } from '../_shared/auth.ts'

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

async function verifyStripeSignature(
  payload: string,
  signature: string | null,
  secret: string,
): Promise<boolean> {
  if (!signature) return false

  const sigParts = signature.split(',').map(p => p.split('=', 2)) as [string, string][]
  const timestamp = sigParts.find(([k]) => k === 't')?.[1]
  const v1s = sigParts.filter(([k]) => k === 'v1').map(([, v]) => v)
  if (!timestamp || v1s.length === 0) return false

  const TOLERANCE_SECONDS = 300
  const ts = Number(timestamp)
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > TOLERANCE_SECONDS) {
    return false
  }

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

  for (const expected of v1s) {
    if (computed.length !== expected.length) continue
    let diff = 0
    for (let i = 0; i < computed.length; i++) diff |= computed.charCodeAt(i) ^ expected.charCodeAt(i)
    if (diff === 0) return true
  }
  return false
}

Deno.serve(async request => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const webhookSecret = Deno.env.get('STRIPE_INVOICE_WEBHOOK_SECRET')?.trim()
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
    subscription?: string
    mode?: string
  }

  if (!session?.id) {
    console.error('webhook: malformed session', event.data?.object)
    return new Response('Malformed session', { status: 400 })
  }

  const invoiceToken = session.metadata?.invoice_token
  const invoiceId = session.metadata?.invoice_id

  if (!invoiceToken && !invoiceId) {
    return new Response('Not an invoice checkout', { status: 200 })
  }

  const supabaseAdmin = getSupabaseAdminClient()

  const query = supabaseAdmin
    .from('invoices')
    .select('id, status, paid_at')

  if (invoiceId) {
    query.eq('id', invoiceId)
  } else {
    query.eq('invoice_token', invoiceToken)
  }

  const { data: invoice, error: loadError } = await query.single()

  if (loadError || !invoice) {
    console.error('webhook: invoice not found', { invoiceId, invoiceToken, error: loadError })
    return new Response('Invoice not found', { status: 200 })
  }

  if (invoice.paid_at) {
    return new Response('Already processed', { status: 200 })
  }

  const updatePayload: Record<string, unknown> = {
    paid_at: new Date().toISOString(),
    status: 'paid',
    stripe_checkout_session_id: session.id,
  }

  if (session.subscription) {
    updatePayload.stripe_subscription_id = session.subscription
  }

  const { error: updateError } = await supabaseAdmin
    .from('invoices')
    .update(updatePayload)
    .eq('id', invoice.id)
    .is('paid_at', null)

  if (updateError) {
    console.error('webhook: update failed', updateError)
    return new Response('Update failed', { status: 500 })
  }

  console.log('invoice marked paid', { invoiceId: invoice.id, sessionId: session.id })
  return new Response('ok', { status: 200 })
})
```

**Step 2: Deploy the edge function**

Deploy via Supabase MCP. Note: a new Stripe webhook endpoint must be configured in the Stripe Dashboard pointing to this function's URL, listening for `checkout.session.completed`. The `STRIPE_INVOICE_WEBHOOK_SECRET` env var must be set in Supabase.

**Step 3: Commit**

```bash
git add supabase/functions/stripe-invoice-webhook/index.ts
git commit -m "feat: add stripe-invoice-webhook for payment confirmation"
```

---

### Task 7: Create public InvoicePage component

**Files:**
- Create: `src/pages/marketing/InvoicePage.jsx`

**Step 1: Write the public invoice page**

This page loads an invoice by token from Supabase, displays it with branding, and provides a Pay Now button that triggers the `create-invoice-checkout` edge function.

The page has 5 states:
1. Loading — spinner
2. Not found — invalid/expired token
3. Unpaid — full invoice display + Pay Now
4. Processing — returned from Stripe, waiting for webhook confirmation
5. Paid — success message + receipt link

Use the existing `MarketingLayout` for Nav/Footer wrapping and inline styles matching the site's existing `inputStyle` / marketing page patterns (white background cards with subtle borders, rounded corners, the site's color palette of `#18181a` text, `#7a7888` secondary, `#b8906a` accent).

Key details:
- `useParams()` to get the token from the URL
- `useSearchParams()` to detect `?status=success` for post-payment state
- Fetch invoice via `supabase.from('invoices').select(...)` using the anon key (RLS allows public select)
- Select only safe columns: `invoice_token, description, line_items, amount, currency, payment_type, billing_interval, business_name, customer_name_snapshot, due_date, status, paid_at, stripe_invoice_url`
- Pay Now calls `supabase.functions.invoke('create-invoice-checkout', { body: { invoice_token } })`
- On success response, redirect to `data.url` (Stripe Checkout)
- Format amounts using `formatCurrency` from `src/lib/billing.js`

The page should be clean and professional. Show the Vibefox Studio logo, the client/business name, invoice summary, itemized line items, total amount, and the payment button.

For the success state after payment, show a branded "Payment received" message and if `stripe_invoice_url` exists, link to the Stripe receipt.

**Step 2: Commit**

```bash
git add src/pages/marketing/InvoicePage.jsx
git commit -m "feat: add public branded invoice page component"
```

---

### Task 8: Wire up the route and Vercel config

**Files:**
- Modify: `src/routes/PublicRoutes.jsx`
- Modify: `src/main.jsx`
- Modify: `vercel.json`

**Step 1: Add route to PublicRoutes.jsx**

Add import at top:
```jsx
import InvoicePage from '../pages/marketing/InvoicePage.jsx'
```

Add route inside the fragment (before the closing `</>`):
```jsx
<Route path="/invoice/:token" element={<InvoicePage />} />
```

**Step 2: Add Vercel rewrite**

In `vercel.json`, add before the catch-all rewrite `"/(.*)"`:
```json
{ "source": "/invoice/:token", "destination": "/index.html" }
```

This ensures direct URL visits (not just SPA navigation) work.

**Step 3: Commit**

```bash
git add src/routes/PublicRoutes.jsx vercel.json
git commit -m "feat: wire up /invoice/:token public route and Vercel rewrite"
```

---

### Task 9: Manual testing checklist

**Step 1: Start dev server**

```bash
npm run dev
```

**Step 2: Test admin invoice creation**

- Go to `/admin/invoices`
- Create a new invoice with payment type "One-time" — verify token is generated and public URL is shown
- Create a new invoice with payment type "Subscription" / "Monthly" — verify billing interval selector appears
- Verify "Copy link" button appears in the invoice table
- Click "Copy link" and verify the URL format is `/invoice/<8chars>`

**Step 3: Test public invoice page**

- Visit `/invoice/<token>` for an unpaid invoice — verify branded display with correct details
- Click "Pay Now" — verify redirect to Stripe Checkout
- Visit `/invoice/invalid` — verify 404 state
- Visit a paid invoice — verify paid state is shown

**Step 4: Test payment flow end-to-end**

- Use Stripe test card (4242 4242 4242 4242) to complete payment
- After redirect back, verify success state shows
- Verify webhook marks invoice as paid in database
- Refresh the page — verify it shows the paid state

**Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix: address issues found during manual testing"
```
