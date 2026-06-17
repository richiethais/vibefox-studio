import { getSupabaseAdminClient } from '../_shared/auth.ts'

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
    payment_link?: string
  }

  if (!session?.id) {
    console.error('webhook: malformed session', event.data?.object)
    return new Response('Malformed session', { status: 400 })
  }

  const invoiceToken = session.metadata?.invoice_token
  const invoiceId = session.metadata?.invoice_id
  // Payment Links created from the CRM don't carry invoice_token/invoice_id in
  // metadata, but the completed session references the originating payment link.
  const paymentLinkId = typeof session.payment_link === 'string' ? session.payment_link : null

  if (!invoiceToken && !invoiceId && !paymentLinkId) {
    return new Response('Not an invoice checkout', { status: 200 })
  }

  const supabaseAdmin = getSupabaseAdminClient()

  const query = supabaseAdmin
    .from('invoices')
    .select('id, status, paid_at')

  if (invoiceId) {
    query.eq('id', invoiceId)
  } else if (invoiceToken) {
    query.eq('invoice_token', invoiceToken)
  } else {
    query.eq('stripe_payment_link_id', paymentLinkId)
  }

  const { data: invoice, error: loadError } = await query.single()

  if (loadError || !invoice) {
    console.error('webhook: invoice not found', { invoiceId, invoiceToken, paymentLinkId, error: loadError })
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
