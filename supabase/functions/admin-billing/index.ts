import { requireAdminUser } from '../_shared/auth.ts'
import { corsHeaders, json } from '../_shared/cors.ts'
import { getStripeClient } from '../_shared/stripe.ts'

const DEFAULT_CURRENCY = 'usd'
const MAX_LINE_ITEMS = 10
const MAX_CUSTOM_FIELDS = 4

class ValidationError extends Error {}

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizePhone(value: unknown) {
  const digits = cleanText(value).replace(/\D/g, '')

  if (!digits) return ''
  if (digits.length === 10) return digits
  if (digits.length === 11 && digits.startsWith('1')) return digits

  throw new ValidationError('Phone number must be 10 digits, or 11 digits starting with 1.')
}

function toMinorUnits(value: unknown) {
  const numeric = Number(value)

  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new ValidationError('Amounts must be greater than 0.')
  }

  return Math.round(numeric * 100)
}

function sanitizeLineItems(input: unknown) {
  if (!Array.isArray(input) || input.length === 0) {
    throw new ValidationError('At least one line item is required.')
  }

  if (input.length > MAX_LINE_ITEMS) {
    throw new ValidationError(`You can add up to ${MAX_LINE_ITEMS} line items.`)
  }

  return input.map((item, index) => {
    const name = cleanText(item?.name)
    const description = cleanText(item?.description)
    const quantity = Number(item?.quantity || 1)

    if (!name) throw new ValidationError(`Line item ${index + 1} needs a name.`)
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      throw new ValidationError(`Line item ${index + 1} needs a quantity between 1 and 100.`)
    }

    return {
      amount: toMinorUnits(item?.amount),
      description: description || null,
      name,
      quantity,
    }
  })
}

function sanitizeCustomFields(input: unknown) {
  if (!Array.isArray(input)) return []

  return input
    .slice(0, MAX_CUSTOM_FIELDS)
    .map(item => ({
      name: cleanText(item?.name),
      value: cleanText(item?.value),
    }))
    .filter(item => item.name && item.value)
}

function buildInvoiceDescription(lineItems: ReturnType<typeof sanitizeLineItems>, fallback: string) {
  const summary = cleanText(fallback)
  if (summary) return summary
  return lineItems.map(item => item.name).join(', ')
}

function formatLineItemLabel(item: ReturnType<typeof sanitizeLineItems>[number]) {
  const quantityLabel = item.quantity > 1 ? ` (x${item.quantity})` : ''
  if (item.description) return `${item.name}${quantityLabel} - ${item.description}`
  return `${item.name}${quantityLabel}`
}

function getDueDateDays(dueDateRaw: string) {
  if (!dueDateRaw) return 14

  const today = new Date()
  const dueDate = new Date(`${dueDateRaw}T00:00:00`)
  const diffMs = dueDate.getTime() - today.getTime()
  return Math.max(1, Math.ceil(diffMs / 86_400_000))
}

async function findOrCreateCustomer(stripe: ReturnType<typeof getStripeClient>, input: {
  email: string
  name: string
  phone: string
}) {
  const customers = await stripe.customers.list({
    email: input.email,
    limit: 1,
  })

  const existing = customers.data[0]

  if (existing) {
    return stripe.customers.update(existing.id, {
      email: input.email,
      name: input.name || undefined,
      phone: input.phone || undefined,
    })
  }

  return stripe.customers.create({
    email: input.email,
    name: input.name || undefined,
    phone: input.phone || undefined,
  })
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405)
  }

  try {
    const { supabaseAdmin } = await requireAdminUser(request)
    const stripe = getStripeClient()
    const body = await request.json()
    const action = cleanText(body.action)
    const clientId = cleanText(body.client_id)

    if (!clientId) {
      return json({ error: 'Client selection is required.' }, 400)
    }

    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id, name, email, phone, company')
      .eq('id', clientId)
      .single()

    if (clientError || !client) {
      return json({ error: clientError?.message || 'Client not found.' }, 404)
    }

    const currency = (cleanText(body.currency) || DEFAULT_CURRENCY).toLowerCase()
    const lineItems = sanitizeLineItems(body.line_items)
    const customFields = sanitizeCustomFields(body.custom_fields)
    const customerEmail = cleanText(body.customer_email).toLowerCase() || cleanText(client.email).toLowerCase()
    const customerName = cleanText(body.customer_name) || cleanText(client.name)
    const customerPhone = normalizePhone(body.customer_phone || client.phone)
    const description = buildInvoiceDescription(lineItems, cleanText(body.description))
    const totalAmountMinor = lineItems.reduce((sum, item) => sum + item.amount * item.quantity, 0)
    const invoiceRowPayload = {
      amount: totalAmountMinor / 100,
      client_id: client.id,
      currency,
      custom_fields: customFields,
      customer_email_snapshot: customerEmail || null,
      customer_name_snapshot: customerName || null,
      description,
      due_date: cleanText(body.due_date) || null,
      line_items: lineItems,
      metadata: {},
      status: 'unpaid',
    }

    if (action === 'create_payment_link') {
      const paymentLink = await stripe.paymentLinks.create({
        billing_address_collection: 'required',
        customer_creation: 'always',
        line_items: lineItems.map(item => ({
          price_data: {
            currency,
            product_data: {
              description: item.description || undefined,
              name: item.name,
            },
            unit_amount: item.amount,
          },
          quantity: item.quantity,
        })),
        metadata: {
          client_id: client.id,
          client_name: client.name || '',
          customer_email: customerEmail || '',
        },
        submit_type: 'pay',
      })

      const { data: invoiceRow, error: insertError } = await supabaseAdmin
        .from('invoices')
        .insert({
          ...invoiceRowPayload,
          kind: 'payment_link',
          stripe_payment_link_id: paymentLink.id,
          stripe_payment_link_url: paymentLink.url,
        })
        .select('*')
        .single()

      if (insertError) {
        return json({ error: insertError.message || 'Payment link created but CRM sync failed.' }, 500)
      }

      return json({
        billingRecord: invoiceRow,
        kind: 'payment_link',
        url: paymentLink.url,
      })
    }

    if (action !== 'create_invoice') {
      return json({ error: 'Unsupported billing action.' }, 400)
    }

    if (!customerEmail) {
      return json({ error: 'Customer email is required to create an invoice.' }, 400)
    }

    const customer = await findOrCreateCustomer(stripe, {
      email: customerEmail,
      name: customerName,
      phone: customerPhone,
    })

    const draftInvoice = await stripe.invoices.create({
      auto_advance: false,
      collection_method: 'send_invoice',
      custom_fields: customFields.length > 0 ? customFields : undefined,
      customer: customer.id,
      days_until_due: getDueDateDays(cleanText(body.due_date)),
      footer: cleanText(body.footer) || undefined,
      metadata: {
        client_id: client.id,
      },
    })

    for (const item of lineItems) {
      await stripe.invoiceItems.create({
        amount: item.amount * item.quantity,
        currency,
        customer: customer.id,
        description: formatLineItemLabel(item),
        invoice: draftInvoice.id,
      })
    }

    const finalizedInvoice = await stripe.invoices.finalizeInvoice(draftInvoice.id, {
      auto_advance: false,
    })

    const shouldSendInvoice = Boolean(body.send_invoice_now)
    const deliveredInvoice = shouldSendInvoice
      ? await stripe.invoices.sendInvoice(finalizedInvoice.id)
      : finalizedInvoice

    const stripeStatus = cleanText(deliveredInvoice.status) || 'open'

    const { data: invoiceRow, error: insertError } = await supabaseAdmin
      .from('invoices')
      .insert({
        ...invoiceRowPayload,
        kind: 'invoice',
        stripe_invoice_id: deliveredInvoice.id,
        stripe_invoice_pdf: deliveredInvoice.invoice_pdf,
        stripe_invoice_status: stripeStatus,
        stripe_invoice_url: deliveredInvoice.hosted_invoice_url,
      })
      .select('*')
      .single()

    if (insertError) {
      return json({ error: insertError.message || 'Invoice created but CRM sync failed.' }, 500)
    }

    return json({
      billingRecord: invoiceRow,
      invoicePdf: deliveredInvoice.invoice_pdf,
      kind: 'invoice',
      status: stripeStatus,
      url: deliveredInvoice.hosted_invoice_url,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected billing error.'
    const status = message === 'Unauthorized'
      ? 401
      : message === 'Forbidden'
        ? 403
        : error instanceof ValidationError
          ? 400
          : 500
    return json({ error: message }, status)
  }
})
