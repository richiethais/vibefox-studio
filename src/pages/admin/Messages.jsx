import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import useIsMobile from '../../components/useIsMobile'

function formatPreviewTime(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  const now = new Date()
  const sameDay = date.toDateString() === now.toDateString()
  if (sameDay) return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function AdminMessages() {
  const [clients, setClients] = useState([])
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [body, setBody] = useState('')
  const [latestByClient, setLatestByClient] = useState({})
  const [loadingClients, setLoadingClients] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const isMobile = useIsMobile(768)
  const scrollRef = useRef(null)
  const selectedRef = useRef(null)

  useEffect(() => {
    selectedRef.current = selected
  }, [selected])

  const loadOverview = useCallback(async () => {
    const [clientsRes, recentRes] = await Promise.all([
      supabase.from('clients').select('id, name, email').order('name'),
      supabase
        .from('messages')
        .select('client_id, body, created_at, from_admin')
        .order('created_at', { ascending: false })
        .limit(500),
    ])

    if (clientsRes.error) {
      setError(clientsRes.error.message || 'Failed to load clients.')
      setLoadingClients(false)
      return
    }

    const latest = {}
    for (const message of recentRes.data ?? []) {
      if (!latest[message.client_id]) latest[message.client_id] = message
    }

    setClients(clientsRes.data ?? [])
    setLatestByClient(latest)
    setLoadingClients(false)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => loadOverview(), 0)
    return () => window.clearTimeout(timer)
  }, [loadOverview])

  const loadMessages = useCallback(async clientId => {
    if (!clientId) return

    setLoadingMessages(true)
    const { data, error: loadError } = await supabase
      .from('messages')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at')

    if (loadError) {
      setError(loadError.message || 'Failed to load messages.')
      setLoadingMessages(false)
      return
    }

    setMessages(data ?? [])
    setLoadingMessages(false)
  }, [])

  useEffect(() => {
    if (!selected) return
    const timer = window.setTimeout(() => loadMessages(selected.id), 0)
    return () => window.clearTimeout(timer)
  }, [selected, loadMessages])

  // Live inbox: new messages update the open thread and the sidebar previews.
  useEffect(() => {
    const channel = supabase
      .channel('admin-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        payload => {
          const message = payload.new
          setLatestByClient(current => ({ ...current, [message.client_id]: message }))
          if (selectedRef.current?.id === message.client_id) {
            setMessages(current => (
              current.some(existing => existing.id === message.id) ? current : [...current, message]
            ))
          }
        },
      )
      .subscribe()

    const poll = window.setInterval(() => {
      loadOverview()
      if (selectedRef.current) loadMessages(selectedRef.current.id)
    }, 30_000)

    return () => {
      supabase.removeChannel(channel)
      window.clearInterval(poll)
    }
  }, [loadOverview, loadMessages])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, loadingMessages])

  // Sort: conversations needing a reply first, then most recent activity, then the rest alphabetically.
  const sortedClients = useMemo(() => {
    return [...clients].sort((a, b) => {
      const lastA = latestByClient[a.id]
      const lastB = latestByClient[b.id]
      const needsReplyA = lastA && !lastA.from_admin ? 1 : 0
      const needsReplyB = lastB && !lastB.from_admin ? 1 : 0
      if (needsReplyA !== needsReplyB) return needsReplyB - needsReplyA
      const timeA = lastA ? new Date(lastA.created_at).getTime() : 0
      const timeB = lastB ? new Date(lastB.created_at).getTime() : 0
      if (timeA !== timeB) return timeB - timeA
      return (a.name || '').localeCompare(b.name || '')
    })
  }, [clients, latestByClient])

  async function send() {
    if (!selected || !body.trim() || sending) return

    setSending(true)
    setError('')

    const { data, error: sendError } = await supabase
      .from('messages')
      .insert({ client_id: selected.id, body: body.trim(), from_admin: true })
      .select()
      .single()

    if (sendError) {
      setError(sendError.message || 'Message failed to send.')
      setSending(false)
      return
    }

    setBody('')
    if (data) {
      setMessages(current => (current.some(m => m.id === data.id) ? current : [...current, data]))
      setLatestByClient(current => ({ ...current, [selected.id]: data }))
    } else {
      await loadMessages(selected.id)
    }
    setSending(false)
  }

  return (
    <div style={{ padding: isMobile ? '20px 16px' : '36px 40px', height: isMobile ? 'auto' : 'calc(100vh - 0px)', display: 'flex', flexDirection: 'column' }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, color: '#18181a', marginBottom: 24, letterSpacing: '-0.4px' }}>Messages</h1>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', color: '#dc2626', fontSize: 12, marginBottom: 12 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 16, flex: 1, overflow: 'hidden' }}>
        <div style={{ width: isMobile ? '100%' : 264, background: 'white', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', overflow: 'auto', flexShrink: isMobile ? undefined : 0, maxHeight: isMobile && selected ? 200 : undefined }}>
          {loadingClients && (
            <div style={{ padding: '14px 16px', fontSize: 12, color: '#7a7888' }}>Loading clients…</div>
          )}

          {!loadingClients && sortedClients.length === 0 && (
            <div style={{ padding: '14px 16px', fontSize: 12, color: '#7a7888' }}>No clients available.</div>
          )}

          {!loadingClients && sortedClients.map(client => {
            const last = latestByClient[client.id]
            const needsReply = Boolean(last && !last.from_admin)
            return (
              <button
                key={client.id}
                onClick={() => setSelected(client)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  border: 'none',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  borderBottom: '1px solid rgba(0,0,0,0.04)',
                  background: selected?.id === client.id ? '#f8f6f2' : 'white',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: needsReply ? 600 : 500, color: '#18181a', display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                    {needsReply && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2563eb', flexShrink: 0 }} title="Awaiting your reply" />}
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.name}</span>
                  </div>
                  {last && <div style={{ fontSize: 10, color: '#a8a6b3', flexShrink: 0 }}>{formatPreviewTime(last.created_at)}</div>}
                </div>
                <div style={{ fontSize: 11, color: needsReply ? '#4b5563' : '#a8a6b3', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {last ? `${last.from_admin ? 'You: ' : ''}${last.body}` : client.email}
                </div>
              </button>
            )
          })}
        </div>

        <div style={{ flex: 1, background: 'white', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: isMobile ? 400 : undefined }}>
          {!selected ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7a7888', fontSize: 14 }}>
              Select a client to view messages
            </div>
          ) : (
            <>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(0,0,0,0.07)', display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{ fontWeight: 500, fontSize: 14, color: '#18181a' }}>{selected.name}</span>
                <span style={{ fontSize: 11, color: '#a8a6b3' }}>{selected.email}</span>
              </div>

              <div ref={scrollRef} style={{ flex: 1, overflow: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {loadingMessages && <div style={{ fontSize: 12, color: '#7a7888' }}>Loading messages…</div>}

                {!loadingMessages && messages.length === 0 && (
                  <div style={{ color: '#7a7888', fontSize: 13 }}>No messages yet.</div>
                )}

                {!loadingMessages && messages.map(message => (
                  <div key={message.id} style={{ display: 'flex', justifyContent: message.from_admin ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '72%', padding: '10px 14px', borderRadius: 12, fontSize: 13, lineHeight: 1.5, background: message.from_admin ? '#18181a' : '#f3f4f6', color: message.from_admin ? 'white' : '#18181a' }}>
                      {message.body}
                      <div style={{ fontSize: 10, opacity: 0.55, marginTop: 4, textAlign: 'right' }}>
                        {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(0,0,0,0.07)', display: 'flex', gap: 10 }}>
                <input
                  value={body}
                  onChange={event => setBody(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      send()
                    }
                  }}
                  placeholder="Type a message…"
                  style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)', fontSize: 13, outline: 'none', background: '#faf9f7' }}
                />
                <button onClick={send} disabled={sending || !body.trim()} style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: '#18181a', color: 'white', fontSize: 13, cursor: 'pointer' }}>
                  {sending ? 'Sending…' : 'Send'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
