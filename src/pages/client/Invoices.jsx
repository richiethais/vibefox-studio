import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/useAuth'
import {
  BILLING_KIND_LABELS,
  BILLING_STATUS_COLORS,
  formatCurrency,
  getBillingActionLabel,
  getBillingActionUrl,
} from '../../lib/billing'
import useIsMobile from '../../components/useIsMobile'

export default function ClientInvoices() {
  const session = useAuth()
  const isMobile = useIsMobile(768)
  const [invoices, setInvoices] = useState([])

  useEffect(() => {
    if (!session) return
    supabase.from('clients').select('id').eq('user_id', session.user.id).single().then(({ data: client }) => {
      if (!client) return
      supabase.from('invoices').select('*').eq('client_id', client.id).order('created_at', { ascending: false }).then(({ data }) => setInvoices(data ?? []))
    })
  }, [session])

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 600, color: '#18181a', marginBottom: 24, letterSpacing: '-0.4px' }}>Billing</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {invoices.map(inv => {
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
                {inv.due_date && <div style={{ color: '#7a7888', fontSize: 12 }}>Due: {inv.due_date}</div>}
              </div>
              <div style={{ alignItems: isMobile ? 'flex-start' : 'center', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 10, textAlign: isMobile ? 'left' : 'right' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#18181a' }}>{formatCurrency(inv.amount, inv.currency)}</div>
                <span style={{ background: statusColor.bg, borderRadius: 100, color: statusColor.text, fontSize: 11, fontWeight: 600, padding: '3px 9px' }}>{inv.status}</span>
                {actionUrl && (
                  <a href={actionUrl} rel="noreferrer" style={linkBtn} target="_blank">
                    {actionLabel}
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const linkBtn = {
  background: '#18181a',
  borderRadius: 100,
  color: 'white',
  fontSize: 12,
  fontWeight: 500,
  padding: '8px 12px',
  textDecoration: 'none',
}
