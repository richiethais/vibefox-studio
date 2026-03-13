import { getSupabaseAdminClient } from '../_shared/auth.ts'
import { corsHeaders, json } from '../_shared/cors.ts'

const RATE_LIMIT_WINDOW_MS = 60_000

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
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return badRequest('Method not allowed.', 405)
  }

  try {
    const supabaseAdmin = getSupabaseAdminClient()
    const body = await request.json()
    const formKey = cleanText(body.form_key) || 'contact'
    const email = cleanText(body.email).toLowerCase()
    const sourceIp = getSourceIp(request)
    const name = cleanText(body.name)
    const company = cleanText(body.company)
    const serviceType = cleanText(body.service_type)
    const budget = cleanText(body.budget)
    const message = cleanText(body.message)

    if (!name) return badRequest('Name is required.')
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return badRequest('A valid email is required.')
    if (!serviceType) return badRequest('Service type is required.')
    if (!budget) return badRequest('Budget is required.')
    if (!message) return badRequest('Message is required.')

    const identifier = `${formKey}:${email}:${sourceIp || 'unknown'}`
    const windowStartIso = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString()

    const { data: existingRateLimit, error: rateLimitError } = await supabaseAdmin
      .from('inquiry_rate_limits')
      .select('created_at')
      .eq('identifier', identifier)
      .gte('created_at', windowStartIso)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (rateLimitError) {
      return json({ error: rateLimitError.message || 'Could not validate rate limit.' }, 500)
    }

    if (existingRateLimit?.created_at) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((RATE_LIMIT_WINDOW_MS - (Date.now() - new Date(existingRateLimit.created_at).getTime())) / 1000),
      )

      return json(
        {
          error: `Only one message per form is allowed every 60 seconds. Try again in ${retryAfterSeconds}s.`,
          retryAfterSeconds,
        },
        429,
      )
    }

    const inquiryPayload = {
      budget,
      company: company || null,
      email,
      form_key: formKey,
      message,
      name,
      service_type: serviceType,
    }

    const { data: inquiry, error: inquiryError } = await supabaseAdmin
      .from('inquiries')
      .insert(inquiryPayload)
      .select('id')
      .single()

    if (inquiryError) {
      return json({ error: inquiryError.message || 'Could not send inquiry.' }, 500)
    }

    const { error: limitInsertError } = await supabaseAdmin
      .from('inquiry_rate_limits')
      .insert({
        email,
        form_key: formKey,
        identifier,
        source_ip: sourceIp,
      })

    if (limitInsertError) {
      return json({ error: limitInsertError.message || 'Inquiry saved but rate limit log failed.' }, 500)
    }

    return json({ id: inquiry.id, ok: true })
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : 'Unexpected error while sending inquiry.' },
      500,
    )
  }
})
