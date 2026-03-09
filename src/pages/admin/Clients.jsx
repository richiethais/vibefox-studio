import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/useAuth'
import useIsMobile from '../../components/useIsMobile'

const PLANS = ['starter', 'growth', 'pro']
const STATUSES = ['active', 'inactive']

export default function AdminClients() {
  const session = useAuth()
  const [clients, setClients] = useState([])
  const [inviteLinks, setInviteLinks] = useState([])
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', company: '', phone: '', plan: 'starter', status: 'active' })
  const [inviting, setInviting] = useState(false)
  const [notice, setNotice] = useState(null)
  const [linkModal, setLinkModal] = useState(false)
  const [linkForm, setLinkForm] = useState({ name: '', email: '' })
  const [generatedLink, setGeneratedLink] = useState('')
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copiedToken, setCopiedToken] = useState('')
  const isMobile = useIsMobile(768)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://vibefoxstudio.com'
  const registeredEmails = useMemo(
    () => new Set(clients.filter(c => c.user_id).map(c => (c.email || '').trim().toLowerCase())),
    [clients]
  )

  const load = async () => {
    const [clientsRes, linksRes] = await Promise.all([
      supabase.from('clients').select('*').order('created_at', { ascending: false }),
      supabase.from('invite_tokens').select('*').order('created_at', { ascending: false }),
    ])

    setClients(clientsRes.data ?? [])
    setInviteLinks(linksRes.data ?? [])
  }

  useEffect(() => {
    Promise.all([
      supabase.from('clients').select('*').order('created_at', { ascending: false }),
      supabase.from('invite_tokens').select('*').order('created_at', { ascending: false }),
    ]).then(([clientsRes, linksRes]) => {
      setClients(clientsRes.data ?? [])
      setInviteLinks(linksRes.data ?? [])
    })
  }, [])

  function buildInviteLink(token) {
    return `${baseUrl}/join?token=${token}`
  }

  function openCreate() {
    setForm({ name: '', email: '', company: '', phone: '', plan: 'starter', status: 'active' })
    setModal('create')
  }

  function openEdit(client) {
    setForm({ name: client.name, email: client.email, company: client.company ?? '', phone: client.phone ?? '', plan: client.plan, status: client.status })
    setModal(client)
  }

  async function save() {
    if (modal === 'create') {
      await supabase.from('clients').insert(form)
    } else {
      await supabase.from('clients').update(form).eq('id', modal.id)
    }
    setModal(null)
    load()
  }

  async function sendInvite(client) {
    setInviting(true)
    setNotice(null)

    const { error } = await supabase.functions.invoke('invite-client', {
      body: { email: client.email, name: client.name },
      headers: { Authorization: `Bearer ${session.access_token}` },
    })

    setInviting(false)
    setNotice(error
      ? { type: 'error', text: `Error: ${error.message}` }
      : { type: 'success', text: `Invite sent to ${client.email}` }
    )
  }

  async function generateLink() {
    const cleanName = linkForm.name.trim()
    const cleanEmail = linkForm.email.trim().toLowerCase()
    if (!cleanName || !cleanEmail) return

    setGenerating(true)
    setNotice(null)

    const { data: existing } = await supabase
      .from('clients')
      .select('id, user_id')
      .eq('email', cleanEmail)
      .maybeSingle()

    if (existing?.user_id) {
      setGenerating(false)
      setNotice({ type: 'error', text: `${cleanEmail} already has a registered account. No new invite link was created.` })
      return
    }

    const { data, error } = await supabase
      .from('invite_tokens')
      .insert({ name: cleanName, email: cleanEmail })
      .select('token')
      .single()

    setGenerating(false)
    if (error) {
      setNotice({ type: 'error', text: `Error: ${error.message}` })
      return
    }

    setGeneratedLink(buildInviteLink(data.token))
    setNotice({ type: 'success', text: `Invite link created for ${cleanEmail}` })
    await load()
  }

  function getLinkStatus(link) {
    const email = (link.email || '').trim().toLowerCase()
    const isRegistered = Boolean(link.used || registeredEmails.has(email))

    if (isRegistered) return { label: 'Registered', bg: '#dcfce7', text: '#16a34a' }
    return { label: 'Pending', bg: '#fef3c7', text: '#d97706' }
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div style={{ padding: isMobile ? '20px 16px' : '36px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#18181a', letterSpacing: '-0.4px' }}>Clients</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => { setLinkModal(true); setGeneratedLink(''); setLinkForm({ name: '', email: '' }) }} style={ghostBtn}>Generate invite link</button>
          <button onClick={openCreate} style={darkBtn}>+ New client</button>
        </div>
      </div>

      {notice && (
        <div style={{
          background: notice.type === 'error' ? '#fef2f2' : '#f0fdf4',
          border: `1px solid ${notice.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
          borderRadius: 10,
          padding: '10px 16px',
          fontSize: 13,
          color: notice.type === 'error' ? '#dc2626' : '#16a34a',
          marginBottom: 16,
        }}>
          {notice.text}
        </div>
      )}

      <div style={{ background: 'white', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
                {['Name', 'Email', 'Company', 'Plan', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, color: '#7a7888', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 500, color: '#18181a' }}>{c.name}</td>
                  <td style={{ padding: '12px 16px', color: '#7a7888' }}>{c.email}</td>
                  <td style={{ padding: '12px 16px', color: '#7a7888' }}>{c.company || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ ...badge, background: '#f3f4f6', color: '#374151' }}>{c.plan}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ ...badge, background: c.status === 'active' ? '#dcfce7' : '#f3f4f6', color: c.status === 'active' ? '#16a34a' : '#6b7280' }}>{c.status}</span>
                  </td>
                  <td style={{ padding: '12px 16px', display: 'flex', gap: 8 }}>
                    <button onClick={() => openEdit(c)} style={ghostBtn}>Edit</button>
                    <button onClick={() => sendInvite(c)} disabled={inviting} style={ghostBtn}>
                      {inviting ? '…' : 'Invite'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: 24, background: 'white', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(0,0,0,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#18181a' }}>Invite links</h2>
          <span style={{ fontSize: 12, color: '#7a7888' }}>{inviteLinks.length} total</span>
        </div>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
                {['Name', 'Email', 'Created', 'Status', 'Link', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, color: '#7a7888', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {inviteLinks.map(link => {
                const status = getLinkStatus(link)
                const url = buildInviteLink(link.token)
                return (
                  <tr key={link.token} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 500, color: '#18181a' }}>{link.name || '—'}</td>
                    <td style={{ padding: '12px 16px', color: '#7a7888' }}>{link.email}</td>
                    <td style={{ padding: '12px 16px', color: '#7a7888' }}>{link.created_at ? new Date(link.created_at).toLocaleString() : '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ ...badge, background: status.bg, color: status.text, textTransform: 'none' }}>{status.label}</span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#7a7888', maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={url}>
                      {url}
                    </td>
                    <td style={{ padding: '12px 16px', display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(url)
                          setCopiedToken(link.token)
                          setTimeout(() => setCopiedToken(''), 2000)
                        }}
                        style={ghostBtn}
                      >
                        {copiedToken === link.token ? 'Copied' : 'Copy'}
                      </button>
                      <a href={url} target="_blank" rel="noreferrer" style={{ ...ghostBtn, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Open</a>
                    </td>
                  </tr>
                )
              })}
              {inviteLinks.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '18px 16px', color: '#7a7888', fontSize: 13 }}>
                    No invite links generated yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {linkModal && (
        <div style={overlay}>
          <div style={getModalBox(isMobile)}>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: '#18181a', marginBottom: 6 }}>Generate invite link</h2>
            <p style={{ fontSize: 13, color: '#7a7888', marginBottom: 20 }}>Pre-fill the client's details. The link is single-use.</p>
            {!generatedLink ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input placeholder="Client name *" value={linkForm.name} onChange={e => setLinkForm(f => ({ ...f, name: e.target.value }))} style={inp} />
                <input placeholder="Client email *" type="email" value={linkForm.email} onChange={e => setLinkForm(f => ({ ...f, email: e.target.value }))} style={inp} />
                <div style={{ display: 'flex', gap: 10, marginTop: 12, justifyContent: 'flex-end' }}>
                  <button onClick={() => setLinkModal(false)} style={ghostBtn}>Cancel</button>
                  <button onClick={generateLink} disabled={generating || !linkForm.name || !linkForm.email} style={darkBtn}>
                    {generating ? 'Generating…' : 'Generate link'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: '#f8f6f2', borderRadius: 10, padding: '12px 14px', fontSize: 12, color: '#18181a', wordBreak: 'break-all', border: '1px solid rgba(0,0,0,0.08)' }}>
                  {generatedLink}
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button onClick={() => setLinkModal(false)} style={ghostBtn}>Close</button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedLink)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    }}
                    style={darkBtn}
                  >
                    {copied ? 'Link copied!' : 'Copy link'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {modal && (
        <div style={overlay}>
          <div style={getModalBox(isMobile)}>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: '#18181a', marginBottom: 20 }}>
              {modal === 'create' ? 'New client' : 'Edit client'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input placeholder="Name *" value={form.name} onChange={set('name')} style={inp} />
              <input placeholder="Email *" type="email" value={form.email} onChange={set('email')} style={inp} />
              <input placeholder="Company" value={form.company} onChange={set('company')} style={inp} />
              <input placeholder="Phone" value={form.phone} onChange={set('phone')} style={inp} />
              <select value={form.plan} onChange={set('plan')} style={inp}>
                {PLANS.map(p => <option key={p}>{p}</option>)}
              </select>
              <select value={form.status} onChange={set('status')} style={inp}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(null)} style={ghostBtn}>Cancel</button>
              <button onClick={save} style={darkBtn}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const badge = { fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 100, textTransform: 'capitalize' }
const inp = { padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)', fontSize: 13, color: '#18181a', background: '#faf9f7', outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' }
const darkBtn = { padding: '9px 18px', borderRadius: 100, border: 'none', background: '#18181a', color: 'white', fontSize: 13, fontWeight: 500, cursor: 'pointer' }
const ghostBtn = { padding: '8px 14px', borderRadius: 100, border: '1px solid rgba(0,0,0,0.1)', background: 'white', color: '#18181a', fontSize: 12, cursor: 'pointer' }
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }
const getModalBox = (isMobile) => ({ background: 'white', borderRadius: 18, padding: isMobile ? 20 : 32, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', margin: isMobile ? 16 : 0 })
