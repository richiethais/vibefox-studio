import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ inquiries: 0, clients: 0, projects: 0, invoices: 0, drafts: 0 })
  const [recent, setRecent] = useState({ inquiries: [], invoices: [], invites: [], draft: null })

  useEffect(() => {
    async function load() {
      const [
        inquiryCountRes,
        clientCountRes,
        projectCountRes,
        invoiceCountRes,
        draftCountRes,
        inquiriesRes,
        invoicesRes,
        invitesRes,
        latestDraftRes,
      ] = await Promise.all([
        supabase.from('inquiries').select('*', { count: 'exact', head: true }).eq('status', 'new'),
        supabase.from('clients').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('status', 'unpaid'),
        supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
        supabase.from('inquiries').select('id, name, service_type, created_at').eq('status', 'new').order('created_at', { ascending: false }).limit(5),
        supabase.from('invoices').select('id, description, amount, created_at, clients(name)').eq('status', 'unpaid').order('created_at', { ascending: false }).limit(5),
        supabase.from('invite_tokens').select('token, name, email, used, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('blog_posts').select('id, title, excerpt, updated_at, slug, status').eq('status', 'draft').order('updated_at', { ascending: false }).limit(1).maybeSingle(),
      ])

      setStats({
        inquiries: inquiryCountRes.count ?? 0,
        clients: clientCountRes.count ?? 0,
        projects: projectCountRes.count ?? 0,
        invoices: invoiceCountRes.count ?? 0,
        drafts: draftCountRes.count ?? 0,
      })

      setRecent({
        inquiries: inquiriesRes.data ?? [],
        invoices: invoicesRes.data ?? [],
        invites: invitesRes.data ?? [],
        draft: latestDraftRes.data ?? null,
      })
    }

    load()
  }, [])

  const cards = useMemo(() => ([
    { label: 'New inquiries', value: stats.inquiries, color: '#2563eb', route: '/admin/inquiries', hint: 'Needs follow-up' },
    { label: 'Active clients', value: stats.clients, color: '#16a34a', route: '/admin/clients', hint: 'Current accounts' },
    { label: 'Active projects', value: stats.projects, color: '#7c3aed', route: '/admin/projects', hint: 'In progress' },
    { label: 'Unpaid invoices', value: stats.invoices, color: '#d97706', route: '/admin/invoices', hint: 'Cashflow check' },
    { label: 'Draft blogs', value: stats.drafts, color: '#b45309', route: '/admin/blogs', hint: 'Ready to publish' },
  ]), [stats])

  return (
    <div style={{ padding: '36px 40px' }}>
      <div className="anim-rise-1" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22, gap: 14, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#18181a', margin: 0, letterSpacing: '-0.4px' }}>Dashboard</h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: 'Review inquiries', route: '/admin/inquiries' },
            { label: 'Write blog', route: '/admin/blogs' },
            { label: 'Check invoices', route: '/admin/invoices' },
          ].map(action => (
            <button
              key={action.label}
              onClick={() => navigate(action.route)}
              style={{
                padding: '8px 14px',
                borderRadius: 100,
                border: '1px solid rgba(0,0,0,0.1)',
                background: 'white',
                color: '#18181a',
                fontSize: 12,
                cursor: 'pointer',
                transition: 'transform 0.18s ease, box-shadow 0.18s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 5px 12px rgba(0,0,0,0.08)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 18 }}>
        {cards.map((card, idx) => (
          <button
            key={card.label}
            className={`anim-rise-${Math.min(idx + 2, 6)}`}
            onClick={() => navigate(card.route)}
            style={{
              textAlign: 'left',
              background: 'white',
              borderRadius: 14,
              padding: '20px 22px',
              border: '1px solid rgba(0,0,0,0.07)',
              cursor: 'pointer',
              transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.08)'
              e.currentTarget.style.borderColor = 'rgba(0,0,0,0.16)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'none'
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.borderColor = 'rgba(0,0,0,0.07)'
            }}
          >
            <div style={{ fontSize: 11, color: '#7a7888', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>{card.label}</div>
            <div style={{ fontSize: 34, fontWeight: 700, color: card.color, letterSpacing: '-1px', lineHeight: 1 }}>{card.value ?? '—'}</div>
            <div style={{ fontSize: 12, color: '#7a7888', marginTop: 8 }}>{card.hint}</div>
          </button>
        ))}
      </div>

      <div className="anim-rise-6" style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1fr 1.1fr', gap: 16 }}>
        <Panel title="New inquiries" actionLabel="Open CRM" onAction={() => navigate('/admin/inquiries')}>
          {recent.inquiries.length === 0 ? (
            <EmptyRow text="No new inquiries." />
          ) : recent.inquiries.map(row => (
            <Row
              key={row.id}
              title={row.name}
              subtitle={`${row.service_type || 'Service not set'} · ${formatDate(row.created_at)}`}
              onClick={() => navigate('/admin/inquiries')}
            />
          ))}
        </Panel>

        <Panel title="Unpaid invoices" actionLabel="View invoices" onAction={() => navigate('/admin/invoices')}>
          {recent.invoices.length === 0 ? (
            <EmptyRow text="No unpaid invoices." />
          ) : recent.invoices.map(row => (
            <Row
              key={row.id}
              title={row.clients?.name || 'Unknown client'}
              subtitle={`${row.description || 'Invoice'} · ${formatMoney(row.amount)}`}
              onClick={() => navigate('/admin/invoices')}
            />
          ))}
        </Panel>

        <Panel title="Invite links" actionLabel="Manage links" onAction={() => navigate('/admin/clients')}>
          {recent.invites.length === 0 ? (
            <EmptyRow text="No links created yet." />
          ) : recent.invites.map(row => (
            <Row
              key={row.token}
              title={row.name || row.email}
              subtitle={`${row.used ? 'Registered' : 'Pending'} · ${formatDate(row.created_at)}`}
              onClick={() => navigate('/admin/clients')}
            />
          ))}
        </Panel>

        <Panel title="Blog preview" actionLabel="Open blogs" onAction={() => navigate('/admin/blogs')}>
          {!recent.draft ? (
            <EmptyRow text="No draft blog yet." />
          ) : (
            <div style={{ padding: 14 }}>
              <div style={{ fontSize: 12, color: '#b8906a', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 6 }}>
                Draft preview
              </div>
              <div style={{ fontFamily: '"DM Serif Display", serif', fontSize: 24, color: '#18181a', lineHeight: 1.12 }}>
                {recent.draft.title}
              </div>
              <div style={{ fontSize: 13, color: '#7a7888', marginTop: 8, lineHeight: 1.55 }}>
                {recent.draft.excerpt || 'No excerpt added yet.'}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button style={smallBtn} onClick={() => navigate(`/admin/blogs?preview=${recent.draft.id}`)}>Preview</button>
                <button style={smallBtn} onClick={() => navigate('/admin/blogs')}>Edit draft</button>
              </div>
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}

function Panel({ title, actionLabel, onAction, children }) {
  return (
    <div style={{ background: 'white', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#18181a' }}>{title}</h2>
        <button onClick={onAction} style={smallBtn}>
          {actionLabel}
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  )
}

function Row({ title, subtitle, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: 'left',
        width: '100%',
        border: 'none',
        background: 'white',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
        padding: '11px 14px',
        cursor: 'pointer',
        transition: 'background 0.15s ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = '#f8f6f2' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'white' }}
    >
      <div style={{ fontSize: 13, color: '#18181a', fontWeight: 500 }}>{title}</div>
      <div style={{ fontSize: 12, color: '#7a7888', marginTop: 2 }}>{subtitle}</div>
    </button>
  )
}

function EmptyRow({ text }) {
  return <div style={{ padding: '14px', fontSize: 12, color: '#7a7888' }}>{text}</div>
}

function formatDate(date) {
  if (!date) return 'Unknown date'
  return new Date(date).toLocaleDateString()
}

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString()}`
}

const smallBtn = {
  padding: '6px 10px',
  borderRadius: 100,
  border: '1px solid rgba(0,0,0,0.1)',
  background: 'white',
  color: '#18181a',
  fontSize: 11,
  cursor: 'pointer',
}
