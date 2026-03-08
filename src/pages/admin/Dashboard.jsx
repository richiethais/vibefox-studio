import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ inquiries: 0, clients: 0, projects: 0, invoices: 0 })

  useEffect(() => {
    async function load() {
      const [{ count: inquiries }, { count: clients }, { count: projects }, { count: invoices }] = await Promise.all([
        supabase.from('inquiries').select('*', { count: 'exact', head: true }).eq('status', 'new'),
        supabase.from('clients').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('status', 'unpaid'),
      ])
      setStats({ inquiries, clients, projects, invoices })
    }
    load()
  }, [])

  const cards = [
    { label: 'New inquiries', value: stats.inquiries, color: '#3b82f6' },
    { label: 'Active clients', value: stats.clients, color: '#10b981' },
    { label: 'Active projects', value: stats.projects, color: '#8b5cf6' },
    { label: 'Unpaid invoices', value: stats.invoices, color: '#f59e0b' },
  ]

  return (
    <div style={{ padding: '36px 40px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, color: '#18181a', marginBottom: 28, letterSpacing: '-0.4px' }}>Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {cards.map(({ label, value, color }) => (
          <div key={label} style={{ background: 'white', borderRadius: 14, padding: '24px', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div style={{ fontSize: 12, color: '#7a7888', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>{label}</div>
            <div style={{ fontSize: 36, fontWeight: 700, color, letterSpacing: '-1px' }}>{value ?? '—'}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
