import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useClientRecord } from '../../lib/useClientRecord'
import {
  BILLING_KIND_LABELS,
  BILLING_STATUS_COLORS,
  formatCurrency,
  getBillingActionLabel,
  getBillingActionUrl,
} from '../../lib/billing'
import useIsMobile from '../../components/useIsMobile'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'paid', label: 'Paid' },
]

export default function ClientInvoices() {
  const { clientId, loading: clientLoading } = useClientRecord()
  const isMobile = useIsMobile(768)
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (clientLoading) return
    const timer = window.setTimeout(() => {
      if (!clientId) { setLoading(false); return }
      supabase.from('invoices').select('*').eq('client_id', clientId).order('created_at', { ascending: false }).then(({ data }) => {
        setInvoices(data ?? [])
        setLoading(false)
      })
    }, 0)
    return () => window.clearTimeout(timer)
  }, [clientLoading, clientId])

  const openInvoices = useMemo(() => invoices.filter(inv => inv.status !== 'paid'), [invoices])
  const totalDue = openInvoices.reduce((sum, inv) => sum + Number(inv.amount || 0), 0)
  const overdueCount = openInvoices.filter(inv => inv.status === 'overdue').length

  const visible = useMemo(() => {
    if (filter === 'open') return openInvoices
    if (filter === 'paid') return invoices.filter(inv => inv.status === 'paid')
    return invoices
  }, [filter, invoices, openInvoices])

  if (loading || clientLoading) {
    return (
      <div>
        <h1 style={heading}>Billing</h1>
        <div style={{ color: '#7a7888', fontSize: 13 }}>Loading…</div>
      </div>
    )
  }

  return (
    <div>
      <h1 style={heading}>Billing</h1>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        <div style={summaryCard}>
          <div style={summaryLabel}>Balance due</div>
          <div style={{ ...summaryValue, color: totalDue > 0 ? '#18181a' : '#16a34a' }}>{formatCurrency(totalDue)}</div>
        </div>
        <div style={summaryCard}>
          <div style={summaryLabel}>Open items</div>
          <div style={summaryValue}>{openInvoices.length}</div>
        </div>
        <div style={{ ...summaryCard, ...(overdueCount > 0 ? { borderColor: '#fecaca', background: '#fef2f2' } : {}) }}>
          <div style={summaryLabel}>Overdue</div>
          <div style={{ ...summaryValue, color: overdueCount > 0 ? '#dc2626' : '#18181a' }}>{overdueCount}</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              padding: '7px 16px',
              borderRadius: 100,
              border: '1px solid rgba(0,0,0,0.1)',
              background: filter === key ? '#18181a' : 'white',
              color: filter === key ? 'white' : '#7a7888',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#18181a', marginBottom: 4 }}>
            {filter === 'paid' ? 'No paid invoices yet' : filter === 'open' ? 'Nothing due — you\'re all caught up' : 'No invoices yet'}
          </div>
          <div style={{ fontSize: 12, color: '#7a7888' }}>
            {filter === 'all' ? 'Invoices and payment links will appear here.' : ''}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {visible.map(inv => {
            const actionUrl = getBillingActionUrl(inv)
            const actionLabel = getBillingActionLabel(inv)
            const statusColor = BILLING_STATUS_COLORS[inv.status] || BILLING_STATUS_COLORS.unpaid

            return (
              <div key={inv.id} style={{ alignItems: isMobile ? 'flex-start' : 'center', background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 12, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 10 : 0, justifyContent: 'space-between', padding: isMobile ? '14px 16px' : '18px 20px' }}>
                <div>
                  <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#18181a' }}>{inv.description}</div>
                    <span style={{ background: '#f3f4f6', borderRadius: 100, color: '#4b5563', fontSize: 10, fontWeight: 600, padding: '2px 8px', textTransform: 'capitalize' }}>
                      {BILLING_KIND_LABELS[inv.kind] || 'Invoice'}
                    </span>
                  </div>
                  {inv.due_date && <div style={{ color: inv.status === 'overdue' ? '#dc2626' : '#7a7888', fontSize: 12 }}>Due: {inv.due_date}</div>}
                  {inv.status === 'paid' && inv.paid_at && (
                    <div style={{ color: '#7a7888', fontSize: 12 }}>Paid: {new Date(inv.paid_at).toLocaleDateString()}</div>
                  )}
                </div>
                <div style={{ alignItems: isMobile ? 'flex-start' : 'center', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 10, textAlign: isMobile ? 'left' : 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#18181a' }}>{formatCurrency(inv.amount, inv.currency)}</div>
                  <span style={{ background: statusColor.bg, borderRadius: 100, color: statusColor.text, fontSize: 11, fontWeight: 600, padding: '3px 9px' }}>{inv.status}</span>
                  {actionUrl && inv.status !== 'paid' && (
                    <a href={actionUrl} rel="noreferrer" style={linkBtn} target="_blank">
                      {actionLabel}
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const heading = { fontSize: 22, fontWeight: 600, color: '#18181a', marginBottom: 24, letterSpacing: '-0.4px' }

const summaryCard = {
  background: 'white',
  border: '1px solid rgba(0,0,0,0.07)',
  borderRadius: 14,
  padding: '16px 18px',
}

const summaryLabel = { fontSize: 12, color: '#7a7888', fontWeight: 500, marginBottom: 6 }
const summaryValue = { fontSize: 24, fontWeight: 700, color: '#18181a', letterSpacing: '-0.5px' }

const linkBtn = {
  background: '#18181a',
  borderRadius: 100,
  color: 'white',
  fontSize: 12,
  fontWeight: 500,
  padding: '8px 12px',
  textDecoration: 'none',
}
