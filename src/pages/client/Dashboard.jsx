import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/useAuth'

export default function ClientDashboard() {
  const session = useAuth()
  const [projects, setProjects] = useState([])
  const [invoices, setInvoices] = useState([])

  useEffect(() => {
    if (!session) return
    supabase.from('clients').select('id').eq('user_id', session.user.id).single().then(({ data: client }) => {
      if (!client) return
      supabase.from('projects').select('*').eq('client_id', client.id).eq('status', 'active').then(({ data }) => setProjects(data ?? []))
      supabase.from('invoices').select('*').eq('client_id', client.id).neq('status', 'paid').then(({ data }) => setInvoices(data ?? []))
    })
  }, [session])

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 600, color: '#18181a', marginBottom: 28, letterSpacing: '-0.4px' }}>Dashboard</h1>

      {invoices.length > 0 && (
        <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 12, padding: '14px 18px', marginBottom: 24, fontSize: 13, color: '#d97706' }}>
          You have {invoices.length} unpaid invoice{invoices.length > 1 ? 's' : ''}.
        </div>
      )}

      <h2 style={{ fontSize: 15, fontWeight: 600, color: '#18181a', marginBottom: 14 }}>Active projects</h2>
      {projects.length === 0 ? (
        <p style={{ fontSize: 13, color: '#7a7888' }}>No active projects.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {projects.map(p => (
            <div key={p.id} style={{ background: 'white', borderRadius: 12, padding: '18px 20px', border: '1px solid rgba(0,0,0,0.07)' }}>
              <div style={{ fontWeight: 500, fontSize: 14, color: '#18181a', marginBottom: 4 }}>{p.title}</div>
              {p.description && <div style={{ fontSize: 13, color: '#7a7888' }}>{p.description}</div>}
              {p.due_date && <div style={{ fontSize: 12, color: '#7a7888', marginTop: 6 }}>Due: {p.due_date}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
