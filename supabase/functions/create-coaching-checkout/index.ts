import { getSupabaseAdminClient } from '../_shared/auth.ts'
import { corsHeaders, json } from '../_shared/cors.ts'
import { getStripeClient } from '../_shared/stripe.ts'

const RATE_LIMIT_WINDOW_MS = 60_000
const FORM_KEY = 'coaching'
const DEFAULT_SITE_URL = 'https://vibefoxstudio.com'
const PRICE_USD_CENTS = 50_000
const PRICE_DISPLAY = '$500'

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

async function markCheckoutFailed(supabaseAdmin: ReturnType<typeof getSupabaseAdminClient>, inquiryId: string) {
  const { error } = await supabaseAdmin
    .from('inquiries')
    .update({ status: 'checkout_failed' })
    .eq('id', inquiryId)

  if (error) {
    console.error('checkout_failed status update failed', { inquiryId, message: error.message })
  }
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return badRequest('Method not allowed.', 405)

  let stage = 'request start'

  try {
    stage = 'initialize supabase admin client'
    const supabaseAdmin = getSupabaseAdminClient()
    stage = 'parse request body'
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
    const siteUrl = normalizeBaseUrl(request.headers.get('origin')) ||
      normalizeBaseUrl(Deno.env.get('SITE_URL')) ||
      DEFAULT_SITE_URL

    if (!firstName) return badRequest('First name is required.')
    if (!lastName) return badRequest('Last name is required.')
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return badRequest('A valid email is required.')
    if (!reason || reason.length < 20) return badRequest('Please share at least a couple sentences about what you want coaching on.')
    if (!outcome || outcome.length < 10) return badRequest('Please share what you want to walk away with.')

    stage = 'initialize stripe client'
    const stripe = getStripeClient()

    const identifier = `${FORM_KEY}:${email}:${sourceIp || 'unknown'}`
    const windowStartIso = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString()

    stage = 'check rate limit'
    const { data: existingRateLimit, error: rateLimitError } = await supabaseAdmin
      .from('inquiry_rate_limits')
      .select('created_at')
      .eq('identifier', identifier)
      .gte('created_at', windowStartIso)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (rateLimitError) return json({ error: rateLimitError.message, stage }, 500)
    if (existingRateLimit?.created_at) {
      return json({ error: 'Please wait a moment before trying again.' }, 429)
    }

    const name = `${firstName} ${lastName}`.trim()
    const metadata = {
      company_role: companyRole || null,
      experience_level: experienceLevel || null,
      first_name: firstName,
      last_name: lastName,
      outcome,
      phone: phone || null,
      reason,
    }

    stage = 'insert coaching inquiry'
    const { data: inquiry, error: inquiryError } = await supabaseAdmin
      .from('inquiries')
      .insert({
        budget: PRICE_DISPLAY,
        email,
        form_key: FORM_KEY,
        message: reason,
        metadata,
        name,
        service_type: 'coaching',
        status: 'pending_payment',
      })
      .select('id')
      .single()

    if (inquiryError) return json({ error: inquiryError.message, stage }, 500)

    if (!inquiry?.id) {
      console.error('inquiry created without id', inquiry)
      return json({ error: 'Could not start checkout. Try again.', stage }, 500)
    }

    stage = 'insert rate limit record'
    const { error: limitInsertError } = await supabaseAdmin
      .from('inquiry_rate_limits')
      .insert({
        email,
        form_key: FORM_KEY,
        identifier,
        source_ip: sourceIp,
      })
    if (limitInsertError) console.error('rate_limit insert failed', limitInsertError)

    stage = 'create stripe checkout session'
    let session: { id?: string; url?: string }
    try {
      session = await stripe.checkout.sessions.create({
        cancel_url: `${siteUrl}/privatecoaching?canceled=1`,
        client_reference_id: inquiry.id,
        customer_creation: 'always',
        customer_email: email,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                description: 'Private 60-minute coaching session with Vibefox Studio',
                name: '1:1 AI Software Engineering Coaching - 1 hour',
              },
              unit_amount: PRICE_USD_CENTS,
            },
            quantity: 1,
          },
        ],
        metadata: {
          inquiry_id: inquiry.id,
        },
        mode: 'payment',
        payment_intent_data: {
          metadata: {
            inquiry_id: inquiry.id,
          },
        },
        success_url: `${siteUrl}/privatecoaching/thanks?session_id={CHECKOUT_SESSION_ID}`,
      }, {
        idempotencyKey: `coaching-checkout-${inquiry.id}`,
      })
    } catch (error) {
      const code = (error as { code?: string })?.code || null
      const message = error instanceof Error ? error.message : 'Unknown Stripe error.'
      const type = (error as { type?: string })?.type || null
      console.error('stripe checkout error', {
        code,
        message,
        stage,
        type,
      })
      await markCheckoutFailed(supabaseAdmin, inquiry.id)
      return json({ error: 'Could not start checkout. Try again.', stage }, 500)
    }

    if (!session?.id || !session?.url) {
      console.error('stripe returned invalid session', session)
      await markCheckoutFailed(supabaseAdmin, inquiry.id)
      return json({ error: 'Could not start checkout. Try again.', stage }, 500)
    }

    stage = 'persist stripe session id'
    const { error: updateError } = await supabaseAdmin
      .from('inquiries')
      .update({ stripe_session_id: session.id })
      .eq('id', inquiry.id)

    if (updateError) {
      await markCheckoutFailed(supabaseAdmin, inquiry.id)
      return json({ error: updateError.message, stage }, 500)
    }

    return json({ url: session.url, inquiry_id: inquiry.id })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error. Please try again.'
    console.error('create-coaching-checkout unexpected', { message, stage })
    return json({ error: message, stage }, 500)
  }
})
