import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import MarketingLayout from '../../components/marketing/MarketingLayout'
import useIsMobile from '../../components/useIsMobile'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/billing'
import { parseFunctionError } from '../../lib/supabaseFunctions'

const cardStyle = {
  background: '#fff',
  border: '1px solid rgba(0,0,0,0.07)',
  borderRadius: 14,
  maxWidth: 600,
  width: '100%',
  margin: '0 auto',
  padding: '40px 36px',
  boxSizing: 'border-box',
}

const badgeStyle = (bg, color) => ({
  display: 'inline-block',
  padding: '4px 12px',
  borderRadius: 20,
  fontSize: 12,
  fontWeight: 600,
  background: bg,
  color,
})

function getPaymentTypeLabel(paymentType, billingInterval) {
  if (paymentType === 'one_time') return 'One-time'
  if (paymentType === 'subscription') {
    if (billingInterval === 'yearly') return 'Yearly subscription'
    return 'Monthly subscription'
  }
  return 'One-time'
}

function formatDate(dateStr) {
  if (!dateStr) return null
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export default function InvoicePage() {
  const { token } = useParams()
  const [searchParams] = useSearchParams()
  const isMobile = useIsMobile()

  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [payLoading, setPayLoading] = useState(false)
  const [payError, setPayError] = useState(null)

  const [pollExhausted, setPollExhausted] = useState(false)
  const pollCount = useRef(0)
  const pollTimer = useRef(null)

  const isSuccess = searchParams.get('status') === 'success'
  const isPaid = invoice?.paid_at || invoice?.status === 'paid'
  const isProcessing = isSuccess && !isPaid && !pollExhausted
  const isConfirmPending = isSuccess && !isPaid && pollExhausted

  const fetchInvoice = useCallback(async () => {
    const { data, error } = await supabase
      .from('invoices')
      .select('invoice_token, description, line_items, amount, currency, payment_type, billing_interval, business_name, customer_name_snapshot, due_date, status, paid_at, stripe_invoice_url')
      .eq('invoice_token', token)
      .single()

    if (error || !data) {
      setNotFound(true)
    } else {
      setInvoice(data)
    }
    setLoading(false)
  }, [token])

  useEffect(() => {
    let cancelled = false
    supabase
      .from('invoices')
      .select('invoice_token, description, line_items, amount, currency, payment_type, billing_interval, business_name, customer_name_snapshot, due_date, status, paid_at, stripe_invoice_url')
      .eq('invoice_token', token)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error || !data) {
          setNotFound(true)
        } else {
          setInvoice(data)
        }
        setLoading(false)
      })
    return () => {
      cancelled = true
      if (pollTimer.current) clearInterval(pollTimer.current)
    }
  }, [token])

  useEffect(() => {
    if (!isSuccess || isPaid || loading || pollExhausted) return
    pollTimer.current = setInterval(() => {
      pollCount.current += 1
      if (pollCount.current >= 5) {
        clearInterval(pollTimer.current)
        setPollExhausted(true)
      } else {
        fetchInvoice()
      }
    }, 3000)
    return () => clearInterval(pollTimer.current)
  }, [isSuccess, isPaid, loading, pollExhausted, fetchInvoice])

  // Pay now handler
  async function handlePayNow() {
    setPayLoading(true)
    setPayError(null)
    try {
      const { data, error } = await supabase.functions.invoke('create-invoice-checkout', {
        body: { invoice_token: token },
      })
      if (error) {
        const parsed = await parseFunctionError(error, 'Unable to start checkout.')
        setPayError(parsed.message)
        setPayLoading(false)
        return
      }
      if (data?.url) {
        window.location.href = data.url
      } else {
        setPayError('Unable to start checkout. Please try again.')
        setPayLoading(false)
      }
    } catch {
      setPayError('Something went wrong. Please try again.')
      setPayLoading(false)
    }
  }

  // --- Render states ---

  function renderLoading() {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div style={{ fontSize: 14, color: '#7a7888' }}>Loading invoice...</div>
      </div>
    )
  }

  function renderNotFound() {
    return (
      <div style={{ ...cardStyle, textAlign: 'center', padding: isMobile ? '40px 20px' : '60px 36px' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#7a7888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: '#18181a', margin: '0 0 8px' }}>Invoice not found</h2>
        <p style={{ fontSize: 14, color: '#7a7888', margin: 0 }}>
          This invoice link may be invalid or expired. Please contact us if you believe this is an error.
        </p>
      </div>
    )
  }

  function renderProcessing() {
    return (
      <div style={{ ...cardStyle, textAlign: 'center', padding: isMobile ? '40px 20px' : '60px 36px' }}>
        <div style={{ marginBottom: 16 }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#b8906a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1.5s linear infinite' }}>
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: '#18181a', margin: '0 0 8px' }}>Payment processing...</h2>
        <p style={{ fontSize: 14, color: '#7a7888', margin: 0 }}>
          Your payment is being confirmed. This page will update automatically.
        </p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  function renderConfirmPending() {
    return (
      <div style={{ ...cardStyle, textAlign: 'center', padding: isMobile ? '40px 20px' : '60px 36px' }}>
        <div style={{ marginBottom: 16 }}>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="11" fill="#fef3c7" />
            <path d="M12 7v5l3 2" stroke="#b8906a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: '#18181a', margin: '0 0 8px' }}>We're confirming your payment</h2>
        <p style={{ fontSize: 14, color: '#7a7888', margin: '0 0 8px', lineHeight: 1.5 }}>
          Thanks! If your payment went through, your bank will show the charge shortly. This page may take a few minutes
          to update while we confirm with Stripe.
        </p>
        <p style={{ fontSize: 14, color: '#7a7888', margin: 0, lineHeight: 1.5 }}>
          If you don't see a confirmation soon, email{' '}
          <a href="mailto:inquiries@vibefoxstudio.com" style={{ color: '#18181a', fontWeight: 500 }}>
            inquiries@vibefoxstudio.com
          </a>{' '}
          and we'll sort it out.
        </p>
      </div>
    )
  }

  function renderPaid() {
    return (
      <div style={{ ...cardStyle, textAlign: 'center', padding: isMobile ? '40px 20px' : '60px 36px' }}>
        <div style={{ marginBottom: 16 }}>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="11" fill="#dcfce7" />
            <path d="M7.5 12.5l3 3 6-6" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: '#18181a', margin: '0 0 8px' }}>Payment received — thank you!</h2>
        <p style={{ fontSize: 14, color: '#7a7888', margin: '0 0 20px' }}>
          Your payment has been successfully processed.
        </p>
        {invoice?.stripe_invoice_url && (
          <a
            href={invoice.stripe_invoice_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '10px 24px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              color: '#18181a',
              border: '1px solid rgba(0,0,0,0.12)',
              textDecoration: 'none',
            }}
          >
            View receipt
          </a>
        )}
      </div>
    )
  }

  function renderUnpaid() {
    const lineItems = Array.isArray(invoice.line_items) ? invoice.line_items : []

    return (
      <div style={{ ...cardStyle, padding: isMobile ? '32px 20px' : '40px 36px' }}>
        {/* Logo */}
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', color: '#18181a' }}>
            vibefox studio
          </span>
        </div>

        {/* Recipient */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: '#7a7888', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
            Invoice for
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#18181a' }}>
            {invoice.customer_name_snapshot || 'Customer'}
          </div>
          {invoice.business_name && (
            <div style={{ fontSize: 14, color: '#7a7888', marginTop: 2 }}>
              {invoice.business_name}
            </div>
          )}
        </div>

        {/* Description */}
        {invoice.description && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: '#7a7888', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
              Description
            </div>
            <div style={{ fontSize: 14, color: '#18181a', lineHeight: 1.5 }}>
              {invoice.description}
            </div>
          </div>
        )}

        {/* Line items */}
        {lineItems.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: '#7a7888', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
              Items
            </div>
            <div style={{ border: '1px solid rgba(0,0,0,0.07)', borderRadius: 10, overflow: 'hidden' }}>
              {lineItems.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    padding: '12px 16px',
                    borderBottom: idx < lineItems.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#18181a' }}>
                      {item.name || item.description || 'Item'}
                    </div>
                    {item.description && item.name && (
                      <div style={{ fontSize: 13, color: '#7a7888', marginTop: 2 }}>
                        {item.description}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#18181a', marginLeft: 16, whiteSpace: 'nowrap' }}>
                    {formatCurrency((item.amount ?? 0) / 100, invoice.currency)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Total */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 0',
          borderTop: '1px solid rgba(0,0,0,0.07)',
          marginBottom: 20,
        }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: '#18181a' }}>Total</span>
          <span style={{ fontSize: 22, fontWeight: 700, color: '#18181a' }}>
            {formatCurrency(invoice.amount, invoice.currency)}
          </span>
        </div>

        {/* Metadata row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 28, alignItems: 'center' }}>
          <span style={badgeStyle('#f3f0ff', '#6d28d9')}>
            {getPaymentTypeLabel(invoice.payment_type, invoice.billing_interval)}
          </span>
          {invoice.due_date && (
            <span style={{ fontSize: 13, color: '#7a7888' }}>
              Due {formatDate(invoice.due_date)}
            </span>
          )}
        </div>

        {/* Pay Now button */}
        <button
          onClick={handlePayNow}
          disabled={payLoading}
          style={{
            width: '100%',
            padding: '14px 24px',
            borderRadius: 10,
            border: 'none',
            background: '#18181a',
            color: '#fff',
            fontSize: 16,
            fontWeight: 600,
            cursor: payLoading ? 'not-allowed' : 'pointer',
            opacity: payLoading ? 0.7 : 1,
            fontFamily: 'inherit',
            transition: 'opacity 0.15s',
          }}
        >
          {payLoading ? 'Redirecting...' : 'Pay Now'}
        </button>

        {payError && (
          <div style={{ marginTop: 12, fontSize: 13, color: '#dc2626', textAlign: 'center' }}>
            {payError}
          </div>
        )}
      </div>
    )
  }

  // --- Main render ---

  let content
  if (loading) {
    content = renderLoading()
  } else if (notFound) {
    content = renderNotFound()
  } else if (isPaid) {
    content = renderPaid()
  } else if (isProcessing) {
    content = renderProcessing()
  } else if (isConfirmPending) {
    content = renderConfirmPending()
  } else {
    content = renderUnpaid()
  }

  return (
    <MarketingLayout hideCTA>
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '40px 16px' : '60px 20px',
      }}>
        {content}
      </div>
    </MarketingLayout>
  )
}
