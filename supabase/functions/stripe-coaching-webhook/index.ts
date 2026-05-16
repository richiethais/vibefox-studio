import { getSupabaseAdminClient } from '../_shared/auth.ts'
import { notifyAdmin, sendEmail, buildNotificationHtml, escapeHtml } from '../_shared/resend.ts'

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
  const safeName = escapeHtml(firstName || 'there')
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #111;">Payment confirmed — let's get you on the calendar</h2>
      <p>Hi ${safeName},</p>
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
