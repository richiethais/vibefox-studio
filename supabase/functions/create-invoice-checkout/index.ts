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
