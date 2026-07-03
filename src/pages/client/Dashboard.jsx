import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useClientRecord } from '../../lib/useClientRecord'
import { BILLING_STATUS_COLORS, formatCurrency } from '../../lib/billing'
import useIsMobile from '../../components/useIsMobile'

const PROJECT_STATUS_COLORS = {
  active: { bg: '#dcfce7', text: '#16a34a' },
  complete: { bg: '#dbeafe', text: '#1d4ed8' },
  proposal: { bg: '#f3f4f6', text: '#6b7280' },
}

const REQUEST_STATUS_COLORS = {
  done: { bg: '#dcfce7', text: '#16a34a' },
  'in-progress': { bg: '#fef3c7', text: '#d97706' },
  open: { bg: '#dbeafe', text: '#1d4ed8' },
}

export default function ClientDashboard() {
  const { client, clientId, loading: clientLoading } = useClientRecord()
  const navigate = useNavigate()
  const isMobile = useIsMobile(768)
  const [projects, setProjects] = useState([])
  const [invoices, setInvoices] = useState([])
  const [messages, setMessages] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (clientLoading) return
    const timer = window.setTimeout(() => {
      if (!clientId) { setLoading(false); return }
      Promise.all([
        supabase.from('projects').select('*').eq('client_id', clientId).eq('status', 'active').order('created_at', { ascending: false }).limit(5),
        supabase.from('invoices').select('*').eq('client_id', clientId).neq('status', 'paid').order('due_date', { ascending: true }),
        supabase.from('messages').select('*').eq('client_id', clientId).order('created_at', { ascending: false }).limit(3),
        supabase.from('requests').select('*').eq('client_id', clientId).neq('status', 'done').order('created_at', { ascending: false }).limit(5),
      ]).then(([projectsRes, invoicesRes, messagesRes, requestsRes]) => {
        setProjects(projectsRes.data ?? [])
        setInvoices(invoicesRes.data ?? [])
        setMessages(messagesRes.data ?? [])
        setRequests(requestsRes.data ?? [])
        setLoading(false)
      })
    }, 0)
    return () => window.clearTimeout(timer)
  }, [clientLoading, clientId])

  const totalDue = invoices.reduce((sum, inv) => sum + Number(inv.amount || 0), 0)
  const hasOverdue = invoices.some(inv => inv.status === 'overdue')
  const firstName = (client?.name || '').trim().split(/\s+/)[0]

  if (loading || clientLoading) {
    return (
      <div>
        <h1 style={headingStyle}>Dashboard</h1>
        <div style={{ color: '#7a7888', fontSize: 13 }}>Loading…</div>
      </div>
    )
  }

  return (
    <div>
      <h1 style={{ ...headingStyle, marginBottom: 6 }}>{firstName ? `Welcome back, ${firstName}` : 'Dashboard'}</h1>
      <div style={{ fontSize: 13, color: '#7a7888', marginBottom: 28 }}>
        Here's the latest on your projects, billing, and messages.
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        <div onClick={() => navigate('/client/projects')} style={summaryCard}>
          <div style={summaryLabel}>Active Projects</div>
          <div style={summaryValue}>{projects.length}</div>
        </div>
        <div onClick={() => navigate('/client/messages')} style={summaryCard}>
          <div style={summaryLabel}>Messages</div>
          <div style={summaryValue}>{messages.length}</div>
        </div>
        <div onClick={() => navigate('/client/invoices')} style={{ ...summaryCard, ...(hasOverdue ? { borderColor: '#fde68a', background: '#fffbeb' } : {}) }}>
          <div style={summaryLabel}>Unpaid Invoices</div>
          <div style={summaryValue}>{invoices.length}</div>
          {totalDue > 0 && <div style={{ fontSize: 12, color: hasOverdue ? '#d97706' : '#7a7888', fontWeight: 500, marginTop: 2 }}>{formatCurrency(totalDue)}</div>}
        </div>
        <div onClick={() => navigate('/client/support')} style={summaryCard}>
          <div style={summaryLabel}>Open Requests</div>
          <div style={summaryValue}>{requests.length}</div>
        </div>
      </div>

      {/* Active Projects */}
      <SectionHeader title="Active Projects" onViewAll={() => navigate('/client/projects')} />
      {projects.length === 0 ? (
        <EmptyState text="No active projects." />
      ) : (
        <div style={listStyle}>
          {projects.map(p => {
            const statusColor = PROJECT_STATUS_COLORS[p.status] || PROJECT_STATUS_COLORS.active
            return (
              <div key={p.id} onClick={() => navigate('/client/projects')} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div style={{ fontWeight: 500, fontSize: 14, color: '#18181a' }}>{p.title}</div>
                  <span style={{ ...badge, background: statusColor.bg, color: statusColor.text }}>{p.status}</span>
                </div>
                {p.description && <div style={{ fontSize: 13, color: '#7a7888' }}>{p.description}</div>}
                {p.due_date && <div style={{ fontSize: 12, color: '#7a7888', marginTop: 6 }}>Due: {p.due_date}</div>}
              </div>
            )
          })}
        </div>
      )}

      {/* Recent Messages */}
      <SectionHeader title="Recent Messages" onViewAll={() => navigate('/client/messages')} />
      {messages.length === 0 ? (
        <EmptyState text="No messages yet." />
      ) : (
        <div style={listStyle}>
          {messages.map(msg => (
            <div key={msg.id} onClick={() => navigate('/client/messages')} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: msg.from_admin ? '#b8906a' : '#18181a' }}>
                  {msg.from_admin ? 'Vibefox Studio' : 'You'}
                </div>
                <div style={{ fontSize: 11, color: '#7a7888' }}>
                  {new Date(msg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
              <div style={{ fontSize: 13, color: '#4b5563', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {msg.body}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Unpaid Invoices */}
      <SectionHeader title="Unpaid Invoices" onViewAll={() => navigate('/client/invoices')} />
      {hasOverdue && (
        <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 12, padding: '14px 18px', marginBottom: 12, fontSize: 13, color: '#d97706' }}>
          You have overdue invoices that need attention.
        </div>
      )}
      {invoices.length === 0 ? (
        <EmptyState text="All invoices are paid." />
      ) : (
        <div style={listStyle}>
          {invoices.map(inv => {
            const statusColor = BILLING_STATUS_COLORS[inv.status] || BILLING_STATUS_COLORS.unpaid
            return (
              <div key={inv.id} onClick={() => navigate('/client/invoices')} style={{ ...cardStyle, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14, color: '#18181a', marginBottom: 2 }}>{inv.description}</div>
                  {inv.due_date && <div style={{ fontSize: 12, color: '#7a7888' }}>Due: {inv.due_date}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: isMobile ? 8 : 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#18181a' }}>{formatCurrency(inv.amount, inv.currency)}</div>
                  <span style={{ ...badge, background: statusColor.bg, color: statusColor.text }}>{inv.status}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Open Requests */}
      <SectionHeader title="Open Requests" onViewAll={() => navigate('/client/support')} />
      {requests.length === 0 ? (
        <EmptyState text="No open requests." />
      ) : (
        <div style={listStyle}>
          {requests.map(req => {
            const statusColor = REQUEST_STATUS_COLORS[req.status] || REQUEST_STATUS_COLORS.open
            return (
              <div key={req.id} onClick={() => navigate('/client/support')} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontWeight: 500, fontSize: 13, color: '#18181a' }}>{req.title}</div>
                  <span style={{ ...badge, background: statusColor.bg, color: statusColor.text }}>{req.status}</span>
                </div>
                <div style={{ fontSize: 12, color: '#7a7888', marginTop: 4 }}>
                  {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function SectionHeader({ title, onViewAll }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, marginTop: 28 }}>
      <h2 style={{ fontSize: 15, fontWeight: 600, color: '#18181a', margin: 0 }}>{title}</h2>
      <button onClick={onViewAll} style={{ background: 'none', border: 'none', color: '#7a7888', fontSize: 12, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
        View all
      </button>
    </div>
  )
}

function EmptyState({ text }) {
  return <p style={{ fontSize: 13, color: '#7a7888', marginBottom: 0 }}>{text}</p>
}

const headingStyle = { fontSize: 22, fontWeight: 600, color: '#18181a', marginBottom: 28, letterSpacing: '-0.4px' }

const summaryCard = {
  background: 'white',
  border: '1px solid rgba(0,0,0,0.07)',
  borderRadius: 14,
  cursor: 'pointer',
  padding: '18px 20px',
  transition: 'box-shadow 0.15s ease',
}

const summaryLabel = { fontSize: 12, color: '#7a7888', fontWeight: 500, marginBottom: 6 }
const summaryValue = { fontSize: 26, fontWeight: 700, color: '#18181a', letterSpacing: '-0.5px' }

const listStyle = { display: 'flex', flexDirection: 'column', gap: 10 }

const cardStyle = {
  background: 'white',
  border: '1px solid rgba(0,0,0,0.07)',
  borderRadius: 12,
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  padding: '18px 20px',
  transition: 'box-shadow 0.15s ease',
}

const badge = {
  borderRadius: 100,
  fontSize: 11,
  fontWeight: 600,
  marginLeft: 8,
  padding: '3px 9px',
  whiteSpace: 'nowrap',
}
