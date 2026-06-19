import { DEFAULT_DISPLAY_NAME, DEFAULT_IMAGE, SITE_URL } from './publicSeo.js'

// Fields needed to render the public invoice preview (matches the read scope
// used by the client InvoicePage). Anon RLS already allows reads by token.
const INVOICE_SELECT =
  'invoice_token,description,amount,currency,payment_type,billing_interval,business_name,customer_name_snapshot,due_date,status,paid_at'

export function formatMoney(amount, currency = 'usd') {
  const numericAmount = Number(amount || 0)
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: (currency || 'usd').toUpperCase(),
    }).format(numericAmount)
  } catch {
    return `$${numericAmount.toLocaleString()}`
  }
}

export function getPaymentIntervalLabel(paymentType, billingInterval) {
  if (paymentType === 'subscription') {
    return billingInterval === 'yearly' ? 'Yearly subscription' : 'Monthly subscription'
  }
  return 'One-time payment'
}

export function formatInvoiceDate(dateStr) {
  if (!dateStr) return null
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return null
  }
}

export function isInvoicePaid(invoice) {
  return Boolean(invoice?.paid_at || invoice?.status === 'paid')
}

export async function fetchInvoiceByToken({
  supabaseUrl,
  supabaseAnonKey,
  token,
  fetchImpl = fetch,
} = {}) {
  if (!supabaseUrl || !supabaseAnonKey || !token) return null

  const requestUrl = new URL(`${supabaseUrl}/rest/v1/invoices`)
  requestUrl.searchParams.set('invoice_token', `eq.${token}`)
  requestUrl.searchParams.set('select', INVOICE_SELECT)
  requestUrl.searchParams.set('limit', '1')

  try {
    const response = await fetchImpl(requestUrl, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    })
    if (!response.ok) return null
    const data = await response.json()
    return Array.isArray(data) && data.length > 0 ? data[0] : null
  } catch {
    return null
  }
}

// Absolute URL to the dynamically generated invoice preview image.
export function getInvoiceImageUrl(token) {
  return token ? `${SITE_URL}/api/invoice-og?token=${encodeURIComponent(token)}` : DEFAULT_IMAGE
}

// Builds the OG/meta payload for an invoice payment link. Used by the edge
// function that serves crawlers and real visitors at /invoice/:token.
export function getInvoiceSeo(invoice, token) {
  const path = token ? `/invoice/${token}` : '/invoice'
  const image = getInvoiceImageUrl(token)
  const suffix = ` | ${DEFAULT_DISPLAY_NAME}`

  if (!invoice) {
    return {
      path,
      image,
      title: `Invoice${suffix}`,
      description: `View and pay your ${DEFAULT_DISPLAY_NAME} invoice securely online.`,
    }
  }

  const who = invoice.business_name || invoice.customer_name_snapshot || 'your account'
  const amount = formatMoney(invoice.amount, invoice.currency)
  const dueDate = formatInvoiceDate(invoice.due_date)
  const interval = getPaymentIntervalLabel(invoice.payment_type, invoice.billing_interval)

  if (isInvoicePaid(invoice)) {
    return {
      path,
      image,
      title: `Invoice paid — ${amount}${suffix}`,
      description: `This ${amount} invoice for ${who} has been paid. Thank you!`,
    }
  }

  const dueClause = dueDate ? ` Due ${dueDate}.` : ''
  return {
    path,
    image,
    title: `Pay your invoice — ${amount}${suffix}`,
    description: `${amount} ${interval.toLowerCase()} for ${who}.${dueClause} Pay securely online with ${DEFAULT_DISPLAY_NAME}.`,
  }
}
