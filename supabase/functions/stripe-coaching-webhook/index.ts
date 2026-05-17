import { getSupabaseAdminClient } from '../_shared/auth.ts'
import { notifyAdmin, sendEmail, buildNotificationHtml, escapeHtml } from '../_shared/resend.ts'

const DEFAULT_SITE_URL = 'https://vibefoxstudio.com'

async function verifyStripeSignature(
  payload: string,
  signature: string | null,
  secret: string,
): Promise<boolean> {
  if (!signature) return false

  // Stripe signature header: "t=timestamp,v1=hash,v1=hash,..."
  const sigParts = signature.split(',').map(p => p.split('=', 2)) as [string, string][]
  const timestamp = sigParts.find(([k]) => k === 't')?.[1]
  const v1s = sigParts.filter(([k]) => k === 'v1').map(([, v]) => v)
  if (!timestamp || v1s.length === 0) return false

  // Replay-attack protection: timestamp must be within 5 minutes of now
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

  // Constant-time compare against each candidate v1 (supports Stripe secret rotation)
  for (const expected of v1s) {
    if (computed.length !== expected.length) continue
    let diff = 0
    for (let i = 0; i < computed.length; i++) diff |= computed.charCodeAt(i) ^ expected.charCodeAt(i)
    if (diff === 0) return true
  }
  return false
}

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

function buyerEmailHtml(firstName: string, amountTotal: number, bookingAccessUrl: string) {
  const safeName = escapeHtml(firstName || 'there')
  const amountDisplay = `$${(amountTotal / 100).toFixed(2)}`
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #111;">Payment confirmed — let's get you on the calendar</h2>
      <p>Hi ${safeName},</p>
      <p>Thanks for booking a 1:1 AI Software Engineering coaching session with Vibefox Studio. Your ${amountDisplay} payment was received.</p>
      <p>Pick a 60-minute slot here:</p>
      <p>
        <a href="${bookingAccessUrl}" style="display: inline-block; padding: 12px 20px; background: #111; color: #fff; text-decoration: none; border-radius: 8px;">
          Book your coaching session
        </a>
      </p>
      <p>Or paste this link in your browser: <a href="${bookingAccessUrl}">${bookingAccessUrl}</a></p>
      <p>If you have questions before the session, just reply to this email.</p>
      <p>— The Vibefox Studio team</p>
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

  if (!session || typeof session.id !== 'string') {
    console.error('webhook: malformed session', event.data?.object)
    return new Response('Malformed session', { status: 400 })
  }

  const inquiryId = session.metadata?.inquiry_id
  if (!inquiryId) {
    console.warn('checkout.session.completed missing inquiry_id', session.id)
    return new Response('Missing inquiry_id metadata', { status: 200 })
  }

  const supabaseAdmin = getSupabaseAdminClient()
  const siteUrl = normalizeBaseUrl(Deno.env.get('SITE_URL')) || DEFAULT_SITE_URL
  const bookingAccessUrl = `${siteUrl}/privatecoaching/thanks?session_id=${encodeURIComponent(session.id)}`

  // Load inquiry for its metadata + email, but don't decide idempotency from this read.
  const { data: inquiry, error: loadError } = await supabaseAdmin
    .from('inquiries')
    .select('id, email, name, metadata')
    .eq('id', inquiryId)
    .maybeSingle()

  if (loadError || !inquiry) {
    console.error('webhook: inquiry not found', inquiryId, loadError)
    return new Response('Inquiry not found', { status: 200 })
  }

  const amountTotal = session.amount_total
  if (typeof amountTotal !== 'number') {
    console.error('webhook: session missing amount_total', session.id)
    return new Response('Invalid session amount', { status: 200 })
  }

  // Atomic: only update if NOT already paid. Returns the updated row, or null if no row matched.
  const { data: updated, error: updateError } = await supabaseAdmin
    .from('inquiries')
    .update({
      status: 'paid',
      amount_paid_cents: amountTotal,
      paid_at: new Date().toISOString(),
    })
    .eq('id', inquiryId)
    .in('status', ['pending_payment', 'checkout_failed'])
    .select('id')
    .maybeSingle()

  if (updateError) {
    console.error('webhook: update failed', updateError)
    return new Response('Update failed', { status: 500 })
  }

  if (!updated) {
    // Another delivery already processed this payment — exit cleanly without re-sending emails.
    return new Response('Already processed', { status: 200 })
  }

  const meta = (inquiry.metadata || {}) as Record<string, string | null>
  const buyerEmail = inquiry.email || session.customer_email || session.customer_details?.email || ''

  if (!buyerEmail) {
    console.error('webhook: no buyer email for inquiry', inquiryId, session.id)
  }

  // Admin notification
  await notifyAdmin({
    subject: `💰 Coaching booked — $${(amountTotal / 100).toFixed(2)} PAID — ${inquiry.name}`,
    html: buildNotificationHtml({
      'Name': inquiry.name || '—',
      'Email': inquiry.email || '—',
      'Phone': meta.phone || '—',
      'Company / role': meta.company_role || '—',
      'Experience': meta.experience_level || '—',
      'Reason': meta.reason || '—',
      'Desired outcome': meta.outcome || '—',
      'Amount paid': `$${(amountTotal / 100).toFixed(2)}`,
      'Stripe session': session.id,
    }),
  })

  // Buyer confirmation
  if (buyerEmail) {
    await sendEmail({
      to: buyerEmail,
      subject: 'Your Vibefox coaching session is confirmed — book your time',
      html: buyerEmailHtml(meta.first_name || '', amountTotal, bookingAccessUrl),
      replyTo: 'inquiries@vibefoxstudio.com',
    })
  }

  return new Response('ok', { status: 200 })
})
