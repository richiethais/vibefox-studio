import { useCallback, useMemo, useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/useAuth'
import useIsMobile from '../../components/useIsMobile'
import { MobileCard, MobileCardActions, MobileCardHeader, MobileCardList, MobileCardMeta } from '../../components/admin/MobileCardList'
import { mobileActionBtn, mobileDangerBtn } from '../../components/admin/mobileCardStyles'

const PLANS = ['starter', 'growth', 'pro']
const STATUSES = ['active', 'inactive']
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function AdminClients() {
  const session = useAuth()
  const [clients, setClients] = useState([])
  const [inviteLinks, setInviteLinks] = useState([])
  const [loading, setLoading] = useState(true)

  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', company: '', phone: '', plan: 'starter', status: 'active' })
  const [savingClient, setSavingClient] = useState(false)

  const [linkModal, setLinkModal] = useState(false)
  const [linkForm, setLinkForm] = useState({ name: '', email: '' })
  const [generatedLink, setGeneratedLink] = useState('')
  const [generating, setGenerating] = useState(false)
  const [deletingToken, setDeletingToken] = useState('')

  const [invitingClientId, setInvitingClientId] = useState('')
  const [confirmDeleteClient, setConfirmDeleteClient] = useState(null)
  const [deletingClient, setDeletingClient] = useState(false)
  const [notice, setNotice] = useState(null)
  const [copied, setCopied] = useState(false)
  const [copiedToken, setCopiedToken] = useState('')
  const isMobile = useIsMobile(768)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://vibefoxstudio.com'

  const registeredEmails = useMemo(
    () => new Set(clients.filter(client => client.user_id).map(client => (client.email || '').trim().toLowerCase())),
    [clients]
  )

  const pendingInviteLinks = useMemo(
    () => inviteLinks.filter(link => !link.used && !registeredEmails.has((link.email || '').trim().toLowerCase())),
    [inviteLinks, registeredEmails]
  )

  const load = useCallback(async () => {
    const [clientsRes, linksRes] = await Promise.all([
      supabase.from('clients').select('*').order('created_at', { ascending: false }),
      supabase.from('invite_tokens').select('*').order('created_at', { ascending: false }),
    ])

    if (clientsRes.error || linksRes.error) {
      setNotice({
        type: 'error',
        text: clientsRes.error?.message || linksRes.error?.message || 'Failed to load clients.',
      })
      setLoading(false)
      return
    }

    setClients(clientsRes.data ?? [])
    setInviteLinks((linksRes.data ?? []).map(link => ({
      ...link,
      is_expired: Boolean(link.expires_at && new Date(link.expires_at).getTime() <= Date.now()),
    })))
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      load()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [load])

  useEffect(() => {
    if (!notice) return undefined
    const timer = window.setTimeout(() => setNotice(null), 3200)
    return () => window.clearTimeout(timer)
  }, [notice])

  function buildInviteLink(token) {
    return `${baseUrl}/join?token=${token}`
  }

  function openCreate() {
    setForm({ name: '', email: '', company: '', phone: '', plan: 'starter', status: 'active' })
    setModal('create')
  }

  function openEdit(client) {
    setForm({
      name: client.name,
      email: client.email,
      company: client.company ?? '',
      phone: client.phone ?? '',
      plan: client.plan,
      status: client.status,
    })
    setModal(client)
  }

  function validateClientForm() {
    if (!form.name.trim()) return 'Client name is required.'
    if (!form.email.trim()) return 'Email is required.'
    if (!EMAIL_PATTERN.test(form.email.trim())) return 'Enter a valid email address.'
    return ''
  }

  const clientValidationError = validateClientForm()

  async function save() {
    if (savingClient || clientValidationError) return

    setSavingClient(true)
    setNotice(null)

    const payload = {
      ...form,
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      company: form.company.trim(),
      phone: form.phone.trim(),
    }

    const result = modal === 'create'
      ? await supabase.from('clients').insert(payload)
      : await supabase.from('clients').update(payload).eq('id', modal.id)

    if (result.error) {
      setNotice({ type: 'error', text: `Error: ${result.error.message}` })
      setSavingClient(false)
      return
    }

    setNotice({ type: 'success', text: modal === 'create' ? 'Client created.' : 'Client updated.' })
    setModal(null)
    setSavingClient(false)
    await load()
  }

  async function sendInvite(client) {
    if (!session) {
      setNotice({ type: 'error', text: 'Admin session expired. Please sign in again.' })
      return
    }

    setInvitingClientId(client.id)
    setNotice(null)

    const { error } = await supabase.functions.invoke('invite-client', {
      body: { email: client.email, name: client.name },
      headers: { Authorization: `Bearer ${session.access_token}` },
    })

    setInvitingClientId('')
    setNotice(error
      ? { type: 'error', text: `Error: ${error.message}` }
      : { type: 'success', text: `Invite sent to ${client.email}` }
    )
  }

  async function generateLink() {
    const cleanName = linkForm.name.trim()
    const cleanEmail = linkForm.email.trim().toLowerCase()

    if (!cleanName || !cleanEmail) {
      setNotice({ type: 'error', text: 'Name and email are required.' })
      return
    }

    if (!EMAIL_PATTERN.test(cleanEmail)) {
      setNotice({ type: 'error', text: 'Enter a valid invite email.' })
      return
    }

    setGenerating(true)
    setNotice(null)

    const { data: existingClient } = await supabase
      .from('clients')
      .select('id, user_id')
      .eq('email', cleanEmail)
      .maybeSingle()

    if (existingClient?.user_id) {
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
    if (link.is_expired) return { label: 'Expired', bg: '#f3f4f6', text: '#6b7280' }
    return { label: 'Pending', bg: '#fef3c7', text: '#d97706' }
  }

  async function deleteInviteLink(token) {
    if (!token || deletingToken) return
    const approved = window.confirm('Delete this invite link? It will no longer work.')
    if (!approved) return

    setDeletingToken(token)
    setNotice(null)

    const { error } = await supabase
      .from('invite_tokens')
      .delete()
      .eq('token', token)

    setDeletingToken('')

    if (error) {
      setNotice({ type: 'error', text: `Error: ${error.message}` })
      return
    }

    if (generatedLink.includes(token)) setGeneratedLink('')
    setNotice({ type: 'success', text: 'Invite link deleted.' })
    await load()
  }

  async function handleDeleteClient(id) {
    setDeletingClient(true)
    setNotice(null)

    const clientToDelete = clients.find(c => c.id === id)

    if (clientToDelete?.user_id && session) {
      await supabase.functions.invoke('delete-client', {
        body: { userId: clientToDelete.user_id },
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
    }

    const { error } = await supabase.from('clients').delete().eq('id', id)
    setDeletingClient(false)
    setConfirmDeleteClient(null)
    if (error) {
      setNotice({ type: 'error', text: `Error: ${error.message}` })
      return
    }
    setNotice({ type: 'success', text: 'Client deleted.' })
    await load()
  }

  const set = key => event => setForm(current => ({ ...current, [key]: event.target.value }))

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

      {isMobile ? (
        <MobileCardList loading={loading} loadingText="Loading clients…" emptyText="No clients yet.">
          {clients.map(client => (
            <MobileCard key={client.id}>
              <MobileCardHeader
                title={client.name}
                right={<span style={{ ...badge, background: client.status === 'active' ? '#dcfce7' : '#f3f4f6', color: client.status === 'active' ? '#16a34a' : '#6b7280' }}>{client.status}</span>}
              />
              <MobileCardMeta>
                {client.email}
                <br />
                {client.company || 'No company'} · {client.plan} plan
                {client.created_at ? ` · Joined ${new Date(client.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}` : ''}
              </MobileCardMeta>
              <MobileCardActions>
                <button onClick={() => openEdit(client)} style={mobileActionBtn}>Edit</button>
                <button onClick={() => sendInvite(client)} disabled={invitingClientId === client.id} style={mobileActionBtn}>
                  {invitingClientId === client.id ? 'Sending…' : 'Invite'}
                </button>
                <button onClick={() => setConfirmDeleteClient(client)} style={mobileDangerBtn}>Delete</button>
              </MobileCardActions>
            </MobileCard>
          ))}
        </MobileCardList>
      ) : (
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
                {['Name', 'Email', 'Company', 'Plan', 'Status', 'Joined', 'Actions'].map(header => (
                  <th key={header} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, color: '#7a7888', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} style={{ padding: '16px', color: '#7a7888', fontSize: 13 }}>Loading clients…</td>
                </tr>
              )}

              {!loading && clients.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '16px', color: '#7a7888', fontSize: 13 }}>No clients yet.</td>
                </tr>
              )}

              {!loading && clients.map(client => (
                <tr key={client.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 500, color: '#18181a' }}>{client.name}</td>
                  <td style={{ padding: '12px 16px', color: '#7a7888' }}>{client.email}</td>
                  <td style={{ padding: '12px 16px', color: '#7a7888' }}>{client.company || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ ...badge, background: '#f3f4f6', color: '#374151' }}>{client.plan}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ ...badge, background: client.status === 'active' ? '#dcfce7' : '#f3f4f6', color: client.status === 'active' ? '#16a34a' : '#6b7280' }}>{client.status}</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#7a7888' }}>
                    {client.created_at ? new Date(client.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                  </td>
                  <td style={{ padding: '12px 16px', display: 'flex', gap: 8 }}>
                    <button onClick={() => openEdit(client)} style={ghostBtn}>Edit</button>
                    <button onClick={() => sendInvite(client)} disabled={invitingClientId === client.id} style={ghostBtn}>
                      {invitingClientId === client.id ? 'Sending…' : 'Invite'}
                    </button>
                    <button onClick={() => setConfirmDeleteClient(client)} style={deleteGhostBtn}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      <div style={{ marginTop: 24, alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginBottom: isMobile ? 12 : 0, padding: isMobile ? '0 2px' : 0 }}>
        {isMobile && (
          <>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#18181a' }}>Invite links</h2>
            <span style={{ fontSize: 12, color: '#7a7888' }}>{pendingInviteLinks.length} total</span>
          </>
        )}
      </div>

      {isMobile ? (
        <MobileCardList emptyText="No pending invite links.">
          {pendingInviteLinks.map(link => {
            const status = getLinkStatus(link)
            const url = buildInviteLink(link.token)
            return (
              <MobileCard key={link.token}>
                <MobileCardHeader
                  title={link.name || link.email}
                  right={<span style={{ ...badge, background: status.bg, color: status.text, textTransform: 'none' }}>{status.label}</span>}
                />
                <MobileCardMeta>
                  {link.email}
                  {link.created_at ? ` · ${new Date(link.created_at).toLocaleDateString()}` : ''}
                </MobileCardMeta>
                <MobileCardActions>
                  {status.label === 'Pending' && (
                    <>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(url)
                          setCopiedToken(link.token)
                          setTimeout(() => setCopiedToken(''), 1800)
                        }}
                        style={mobileActionBtn}
                      >
                        {copiedToken === link.token ? 'Copied' : 'Copy link'}
                      </button>
                      <a href={url} target="_blank" rel="noreferrer" style={mobileActionBtn}>Open</a>
                    </>
                  )}
                  <button
                    onClick={() => deleteInviteLink(link.token)}
                    disabled={deletingToken === link.token}
                    style={mobileDangerBtn}
                  >
                    {deletingToken === link.token ? 'Deleting…' : 'Delete'}
                  </button>
                </MobileCardActions>
              </MobileCard>
            )
          })}
        </MobileCardList>
      ) : (
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(0,0,0,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#18181a' }}>Invite links</h2>
          <span style={{ fontSize: 12, color: '#7a7888' }}>{pendingInviteLinks.length} total</span>
        </div>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
                {['Name', 'Email', 'Created', 'Status', 'Link', 'Actions'].map(header => (
                  <th key={header} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, color: '#7a7888', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pendingInviteLinks.map(link => {
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
                    <td style={{ padding: '12px 16px', color: '#7a7888', maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={status.label === 'Pending' ? url : 'Inactive link'}>
                      {status.label === 'Pending' ? url : 'Inactive'}
                    </td>
                    <td style={{ padding: '12px 16px', display: 'flex', gap: 8 }}>
                      {status.label === 'Pending' && (
                        <>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(url)
                              setCopiedToken(link.token)
                              setTimeout(() => setCopiedToken(''), 1800)
                            }}
                            style={ghostBtn}
                          >
                            {copiedToken === link.token ? 'Copied' : 'Copy'}
                          </button>
                          <a href={url} target="_blank" rel="noreferrer" style={{ ...ghostBtn, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                            Open
                          </a>
                        </>
                      )}
                      <button
                        onClick={() => deleteInviteLink(link.token)}
                        disabled={deletingToken === link.token}
                        style={ghostBtn}
                      >
                        {deletingToken === link.token ? 'Deleting…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                )
              })}

              {pendingInviteLinks.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '18px 16px', color: '#7a7888', fontSize: 13 }}>
                    No pending invite links.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {linkModal && (
        <div style={overlay}>
          <div style={getModalBox(isMobile)}>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: '#18181a', marginBottom: 6 }}>Generate invite link</h2>
            <p style={{ fontSize: 13, color: '#7a7888', marginBottom: 20 }}>Pre-fill the client's details. The link is single-use.</p>

            {!generatedLink ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input placeholder="Client name *" value={linkForm.name} onChange={event => setLinkForm(current => ({ ...current, name: event.target.value }))} style={inp} />
                <input placeholder="Client email *" type="email" value={linkForm.email} onChange={event => setLinkForm(current => ({ ...current, email: event.target.value }))} style={inp} />
                <div style={{ display: 'flex', gap: 10, marginTop: 12, justifyContent: 'flex-end' }}>
                  <button onClick={() => setLinkModal(false)} style={ghostBtn}>Cancel</button>
                  <button onClick={generateLink} disabled={generating} style={darkBtn}>
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
                      setTimeout(() => setCopied(false), 1800)
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

      {/* Confirm delete client modal */}
      {confirmDeleteClient && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 28, maxWidth: 420, width: '100%', textAlign: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#18181a', marginBottom: 8 }}>Delete client?</div>
            <div style={{ fontSize: 13, color: '#7a7888', marginBottom: 24, lineHeight: 1.5 }}>
              This will permanently delete <strong>{confirmDeleteClient.name}</strong> and all their associated projects, invoices, and support requests. This action cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setConfirmDeleteClient(null)} disabled={deletingClient} style={{ padding: '10px 20px', borderRadius: 100, border: '1px solid rgba(0,0,0,0.1)', background: 'white', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#18181a' }}>Cancel</button>
              <button onClick={() => handleDeleteClient(confirmDeleteClient.id)} disabled={deletingClient} style={{ padding: '10px 20px', borderRadius: 100, border: 'none', background: '#dc2626', fontSize: 13, fontWeight: 500, cursor: deletingClient ? 'not-allowed' : 'pointer', color: 'white', opacity: deletingClient ? 0.7 : 1 }}>
                {deletingClient ? 'Deleting…' : 'Delete'}
              </button>
            </div>
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
                {PLANS.map(plan => <option key={plan}>{plan}</option>)}
              </select>
              <select value={form.status} onChange={set('status')} style={inp}>
                {STATUSES.map(status => <option key={status}>{status}</option>)}
              </select>

              {clientValidationError && (
                <div style={{ fontSize: 12, color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 10px' }}>
                  {clientValidationError}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(null)} style={ghostBtn}>Cancel</button>
              <button onClick={save} style={darkBtn} disabled={savingClient || Boolean(clientValidationError)}>
                {savingClient ? 'Saving…' : 'Save'}
              </button>
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
const deleteGhostBtn = { padding: '8px 14px', borderRadius: 100, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: 12, cursor: 'pointer' }
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }
const getModalBox = isMobile => ({ background: 'white', borderRadius: 18, padding: isMobile ? 20 : 32, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', margin: isMobile ? 16 : 0 })
