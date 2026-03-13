export const BILLING_STATUS_COLORS = {
  overdue: { bg: '#fee2e2', text: '#dc2626' },
  paid: { bg: '#dcfce7', text: '#16a34a' },
  unpaid: { bg: '#fef3c7', text: '#d97706' },
}

export const BILLING_KIND_LABELS = {
  invoice: 'Invoice',
  payment_link: 'Payment link',
}

export function formatCurrency(amount, currency = 'usd') {
  const numericAmount = Number(amount || 0)

  try {
    return new Intl.NumberFormat('en-US', {
      currency: (currency || 'usd').toUpperCase(),
      style: 'currency',
    }).format(numericAmount)
  } catch {
    return `$${numericAmount.toLocaleString()}`
  }
}

export function getBillingActionUrl(invoice) {
  if (!invoice) return ''
  return invoice.stripe_payment_link_url || invoice.stripe_invoice_url || invoice.stripe_invoice_pdf || ''
}

export function getBillingActionLabel(invoice) {
  if (!invoice) return ''
  if (invoice.stripe_payment_link_url) return 'Open payment link'
  if (invoice.stripe_invoice_url) return 'Open invoice'
  if (invoice.stripe_invoice_pdf) return 'Open PDF'
  return ''
}

export function isStripeBacked(invoice) {
  return Boolean(invoice?.stripe_invoice_id || invoice?.stripe_payment_link_id)
}
