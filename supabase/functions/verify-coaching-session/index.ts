import { getSupabaseAdminClient } from '../_shared/auth.ts'
import { corsHeaders, json } from '../_shared/cors.ts'
import { getStripeClient } from '../_shared/stripe.ts'

const DEFAULT_BOOKING_URL = 'https://cal.com/vibefoxcoaching/private-coaching-consultation'

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeHttpsUrl(value: unknown) {
  const candidate = cleanText(value)
  if (!candidate) return ''

  try {
    const url = new URL(candidate)
    if (url.protocol !== 'https:') return ''
    return url.toString()
  } catch {
    return ''
  }
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405)
  }

  try {
    const body = await request.json().catch(() => ({}))
    const sessionId = cleanText(body.session_id)

    if (!sessionId) {
      return json({ error: 'Session ID is required.' }, 400)
    }

    const stripe = getStripeClient()
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const inquiryId = cleanText(session.metadata?.inquiry_id)

    if (!inquiryId) {
      return json({ error: 'Invalid coaching session.' }, 403)
    }

    if (session.payment_status !== 'paid') {
      return json({ error: 'Payment has not been confirmed yet.' }, 403)
    }

    const supabaseAdmin = getSupabaseAdminClient()
    const { data: inquiry, error: inquiryError } = await supabaseAdmin
      .from('inquiries')
      .select('id, form_key, status, stripe_session_id, amount_paid_cents, paid_at')
      .eq('id', inquiryId)
      .maybeSingle()

    if (inquiryError || !inquiry) {
      return json({ error: 'Coaching inquiry not found.' }, 404)
    }

    if (cleanText(inquiry.form_key) !== 'coaching') {
      return json({ error: 'Invalid coaching inquiry.' }, 403)
    }

    if (cleanText(inquiry.stripe_session_id) && cleanText(inquiry.stripe_session_id) !== sessionId) {
      return json({ error: 'Session mismatch.' }, 403)
    }

    if (inquiry.status !== 'paid') {
      await supabaseAdmin
        .from('inquiries')
        .update({
          status: 'paid',
          amount_paid_cents: typeof session.amount_total === 'number' ? session.amount_total : inquiry.amount_paid_cents,
          paid_at: inquiry.paid_at || new Date().toISOString(),
          stripe_session_id: sessionId,
        })
        .eq('id', inquiryId)
    }

    const bookingUrl = normalizeHttpsUrl(Deno.env.get('CAL_BOOKING_URL')) || DEFAULT_BOOKING_URL

    return json({
      booking_url: bookingUrl,
      inquiry_id: inquiryId,
      ok: true,
    })
  } catch (error) {
    const stripeCode = (error as { code?: string })?.code || null
    const stripeMessage = error instanceof Error ? error.message : 'Unexpected verification error.'
    console.error('verify-coaching-session failed', { stripeCode, stripeMessage })
    return json({ error: 'Could not verify coaching access.' }, 500)
  }
})
