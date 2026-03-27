import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { parseFunctionError } from '../../lib/supabaseFunctions'
import { useAuth } from '../../lib/useAuth'
import useIsMobile from '../../components/useIsMobile'

const EXPIRY_OPTIONS = [
  { label: '15 minutes', value: 15 },
  { label: '1 hour', value: 60 },
  { label: '4 hours', value: 240 },
  { label: '24 hours', value: 1440 },
  { label: 'Never', value: 0 },
]

function isNeverExpires(value) {
  return value && new Date(value).getFullYear() >= 2099
}

function formatDateTime(value) {
  if (!value) return 'Unknown'
  if (isNeverExpires(value)) return 'Never'

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default function AdminAccessLinks() {
  const session = useAuth()
  const isMobile = useIsMobile(768)
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [deletingId, setDeletingId] = useState('')
  const [revokingId, setRevokingId] = useState('')
  const [copiedId, setCopiedId] = useState('')
  const [notice, setNotice] = useState(null)
  const [latestLink, setLatestLink] = useState('')
  const [form, setForm] = useState({ label: '', expiresInMinutes: 60 })

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://vibefoxstudio.com'

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('admin_login_links')
      .select('id, token, label, created_at, expires_at, used_at, revoked_at')
      .order('created_at', { ascending: false })

    if (error) {
      setNotice({ type: 'error', text: `Error: ${error.message}` })
      setLoading(false)
      return
    }

    setLinks(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const timer = window.setInterval(load, 15_000)
    return () => window.clearInterval(timer)
  }, [load])

  useEffect(() => {
    if (!notice) return undefined
    const timer = window.setTimeout(() => setNotice(null), 3200)
    return () => window.clearTimeout(timer)
  }, [notice])

  const { activeLinks, usedLinks } = useMemo(() => {
    const now = Date.now()
    const active = []
    const used = []

    for (const link of links) {
      if (link.revoked_at) {
        used.push(link)
      } else if (link.used_at) {
        used.push(link)
      } else if (new Date(link.expires_at).getTime() <= now) {
        used.push(link)
      } else {
        active.push(link)
      }
    }

    return { activeLinks: active, usedLinks: used }
  }, [links])

  function buildShareUrl(token) {
    return `${baseUrl}/admin/access?token=${token}`
  }

  async function handleCreate(event) {
    event.preventDefault()

    if (!session) {
      setNotice({ type: 'error', text: 'Admin session expired. Please sign in again.' })
      return
    }

    setGenerating(true)
    setNotice(null)

    const { data, error } = await supabase.functions.invoke('admin-login-links', {
      body: {
        action: 'create',
        base_url: baseUrl,
        expires_in_minutes: Number(form.expiresInMinutes),
        label: form.label.trim(),
      },
      headers: { Authorization: `Bearer ${session.access_token}` },
    })

    setGenerating(false)

    if (error || !data?.link) {
      const parsed = await parseFunctionError(error, 'Could not create an admin link.')
      setNotice({ type: 'error', text: parsed.message })
      return
    }

    setLatestLink(data.link)
    setForm(current => ({ ...current, label: '' }))
    setNotice({ type: 'success', text: 'Temporary admin link created.' })
    await load()
  }

  async function copyLink(link, id) {
    try {
      await navigator.clipboard.writeText(link)
      setCopiedId(id)
      setLatestLink(link)
      window.setTimeout(() => setCopiedId(current => (current === id ? '' : current)), 1600)
    } catch {
      setNotice({ type: 'error', text: 'Clipboard access failed. Copy the link manually.' })
    }
  }

  async function revokeLink(id) {
    if (!id || deletingId) return

    const approved = window.confirm('Revoke this admin access link? It will stop working immediately.')
    if (!approved) return

    setDeletingId(id)
    setNotice(null)

    const { error } = await supabase
      .from('admin_login_links')
      .delete()
      .eq('id', id)

    setDeletingId('')

    if (error) {
      setNotice({ type: 'error', text: `Error: ${error.message}` })
      return
    }

    setNotice({ type: 'success', text: 'Admin access link revoked.' })
    await load()
  }

  async function logOutSession(linkId) {
    if (!linkId || revokingId) return

    const approved = window.confirm('Log out this session? The person using this link will be signed out immediately.')
    if (!approved) return

    setRevokingId(linkId)
    setNotice(null)

    const { error } = await supabase.functions.invoke('admin-login-links', {
      body: { action: 'revoke-session', link_id: linkId },
      headers: { Authorization: `Bearer ${session.access_token}` },
    })

    setRevokingId('')

    if (error) {
      const parsed = await parseFunctionError(error, 'Could not revoke session.')
      setNotice({ type: 'error', text: parsed.message })
      return
    }

    setNotice({ type: 'success', text: 'Session logged out successfully.' })
    await load()
  }

  function getLinkStatus(link) {
    if (link.revoked_at) return { label: 'Logged out', color: '#6b7280', bg: '#f3f4f6' }
    if (link.used_at) return { label: 'Active session', color: '#15803d', bg: '#ecfdf3' }
    if (new Date(link.expires_at).getTime() <= Date.now()) return { label: 'Expired', color: '#6b7280', bg: '#f3f4f6' }
    if (isNeverExpires(link.expires_at)) return { label: 'Never expires', color: '#1d4ed8', bg: '#eff6ff' }
    return { label: 'Waiting', color: '#d97706', bg: '#fffbeb' }
  }

  return (
    <div style={{ padding: isMobile ? '20px 16px' : '36px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#18181a', letterSpacing: '-0.4px', margin: 0 }}>Access Links</h1>
          <p style={{ margin: '8px 0 0', fontSize: 13, color: '#6b7280', maxWidth: 620, lineHeight: 1.55 }}>
            Create one-time admin login links. Each link signs in without a password and stays logged in until you explicitly log out the session from here.
          </p>
        </div>
      </div>

      {notice && (
        <div style={{
          background: notice.type === 'error' ? '#fef2f2' : '#f0fdf4',
          border: `1px solid ${notice.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
          borderRadius: 12,
          color: notice.type === 'error' ? '#dc2626' : '#15803d',
          fontSize: 13,
          marginBottom: 16,
          padding: '10px 14px',
        }}>
          {notice.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(340px, 420px) minmax(0, 1fr)', gap: 18, alignItems: 'start' }}>
        {/* Create link panel */}
        <section style={panelStyle}>
          <h2 style={panelTitleStyle}>Create temporary link</h2>
          <form onSubmit={handleCreate} style={{ display: 'grid', gap: 14 }}>
            <label style={fieldStyle}>
              <span style={labelStyle}>Label</span>
              <input
                type="text"
                value={form.label}
                onChange={event => setForm(current => ({ ...current, label: event.target.value }))}
                placeholder="Optional note like Sarah review or urgent access"
                style={inputStyle}
              />
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle}>Expires in</span>
              <select
                value={form.expiresInMinutes}
                onChange={event => setForm(current => ({ ...current, expiresInMinutes: Number(event.target.value) }))}
                style={inputStyle}
              >
                {EXPIRY_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <button type="submit" disabled={generating} style={primaryBtnStyle}>
              {generating ? 'Creating…' : 'Create admin access link'}
            </button>
          </form>

          <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: '#6b7280' }}>
              Links sign in as your admin email. The link expires after the chosen duration, but the session stays active until you click "Log out session" here.
            </p>
          </div>
        </section>

        {/* Links list panel */}
        <section style={panelStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
            <div>
              <h2 style={panelTitleStyle}>Links &amp; Sessions</h2>
              <p style={{ margin: '6px 0 0', fontSize: 12, color: '#6b7280' }}>
                {activeLinks.length} pending &middot; {usedLinks.filter(l => l.used_at && !l.revoked_at).length} active sessions
              </p>
            </div>
            <button onClick={load} style={ghostBtnStyle}>Refresh</button>
          </div>

          {latestLink && (
            <div style={{ marginBottom: 16, borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)', background: '#faf8f5', padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#18181a', marginBottom: 8 }}>Latest link</div>
              <div style={{ fontSize: 12, lineHeight: 1.6, color: '#4b5563', wordBreak: 'break-all' }}>{latestLink}</div>
            </div>
          )}

          {loading ? (
            <div style={emptyStateStyle}>Loading links…</div>
          ) : links.length === 0 ? (
            <div style={emptyStateStyle}>No admin access links yet.</div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {/* Active / pending links */}
              {activeLinks.map(link => {
                const shareUrl = buildShareUrl(link.token)
                const status = getLinkStatus(link)

                return (
                  <article key={link.id} style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: 14, background: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: 14, color: '#18181a' }}>{link.label || 'Untitled admin link'}</strong>
                          <span style={{ borderRadius: 999, padding: '4px 8px', fontSize: 11, fontWeight: 600, background: status.bg, color: status.color }}>
                            {status.label}
                          </span>
                        </div>
                        <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
                          <div>Created {formatDateTime(link.created_at)}</div>
                          <div>Expires {formatDateTime(link.expires_at)}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button onClick={() => copyLink(shareUrl, link.id)} style={ghostBtnStyle}>
                          {copiedId === link.id ? 'Copied' : 'Copy link'}
                        </button>
                        <button onClick={() => revokeLink(link.id)} disabled={deletingId === link.id} style={dangerBtnStyle}>
                          {deletingId === link.id ? 'Revoking…' : 'Revoke'}
                        </button>
                      </div>
                    </div>
                    <div style={{ marginTop: 12, fontSize: 12, color: '#4b5563', wordBreak: 'break-all', lineHeight: 1.6 }}>
                      {shareUrl}
                    </div>
                  </article>
                )
              })}

              {/* Used / active sessions */}
              {usedLinks.map(link => {
                const status = getLinkStatus(link)
                const isActiveSession = link.used_at && !link.revoked_at

                return (
                  <article key={link.id} style={{
                    border: `1px solid ${isActiveSession ? '#bbf7d0' : 'rgba(0,0,0,0.06)'}`,
                    borderRadius: 14,
                    padding: 14,
                    background: isActiveSession ? '#f0fdf4' : '#fafafa',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: 14, color: '#18181a' }}>{link.label || 'Untitled admin link'}</strong>
                          <span style={{ borderRadius: 999, padding: '4px 8px', fontSize: 11, fontWeight: 600, background: status.bg, color: status.color }}>
                            {status.label}
                          </span>
                        </div>
                        <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
                          <div>Created {formatDateTime(link.created_at)}</div>
                          {link.used_at && <div>Signed in {formatDateTime(link.used_at)}</div>}
                          {link.revoked_at && <div>Logged out {formatDateTime(link.revoked_at)}</div>}
                          {!link.used_at && <div>Expired {formatDateTime(link.expires_at)}</div>}
                        </div>
                      </div>
                      {isActiveSession && (
                        <button
                          onClick={() => logOutSession(link.id)}
                          disabled={revokingId === link.id}
                          style={dangerBtnStyle}
                        >
                          {revokingId === link.id ? 'Logging out…' : 'Log out session'}
                        </button>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

const panelStyle = {
  background: 'white',
  borderRadius: 18,
  border: '1px solid rgba(0,0,0,0.06)',
  boxShadow: '0 12px 30px rgba(17, 24, 39, 0.05)',
  padding: 20,
}

const panelTitleStyle = {
  margin: 0,
  color: '#18181a',
  fontSize: 16,
  fontWeight: 600,
}

const fieldStyle = {
  display: 'grid',
  gap: 8,
}

const labelStyle = {
  fontSize: 12,
  fontWeight: 600,
  color: '#374151',
}

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  borderRadius: 12,
  border: '1px solid rgba(0,0,0,0.1)',
  background: '#faf8f5',
  color: '#18181a',
  fontSize: 14,
  outline: 'none',
  padding: '12px 14px',
}

const primaryBtnStyle = {
  border: 'none',
  borderRadius: 12,
  background: '#18181a',
  color: 'white',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 600,
  padding: '12px 14px',
}

const ghostBtnStyle = {
  border: '1px solid rgba(0,0,0,0.1)',
  borderRadius: 10,
  background: 'white',
  color: '#18181a',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
  padding: '9px 12px',
}

const dangerBtnStyle = {
  border: '1px solid #fecaca',
  borderRadius: 10,
  background: '#fef2f2',
  color: '#dc2626',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
  padding: '9px 12px',
}

const emptyStateStyle = {
  borderRadius: 14,
  border: '1px dashed rgba(0,0,0,0.1)',
  color: '#6b7280',
  fontSize: 13,
  padding: '24px 16px',
  textAlign: 'center',
}
