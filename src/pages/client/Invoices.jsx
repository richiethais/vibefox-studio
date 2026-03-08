import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'

const STATUS_COLORS = {
  unpaid: { bg: '#fef3c7', text: '#d97706' },
  paid: { bg: '#dcfce7', text: '#16a34a' },
  overdue: { bg: '#fee2e2', text: '#dc2626' },
}

export default function ClientInvoices() {
  const session = useAuth()
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
      <h1 style={{ fontSize: 22, fontWeight: 600, color: '#18181a', marginBottom: 24, letterSpacing: '-0.4px' }}>Invoices</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {invoices.map(inv => (
          <div key={inv.id} style={{ background: 'white', borderRadius: 12, padding: '18px 20px', border: '1px solid rgba(0,0,0,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: 14, color: '#18181a', marginBottom: 4 }}>{inv.description}</div>
              {inv.due_date && <div style={{ fontSize: 12, color: '#7a7888' }}>Due: {inv.due_date}</div>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#18181a', marginBottom: 6 }}>${Number(inv.amount).toLocaleString()}</div>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 100, background: STATUS_COLORS[inv.status]?.bg, color: STATUS_COLORS[inv.status]?.text }}>{inv.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
