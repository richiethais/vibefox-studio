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
