import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useClientRecord } from '../../lib/useClientRecord'
import useIsMobile from '../../components/useIsMobile'

export default function ClientMessages() {
  const { clientId, loading: clientLoading, error: clientError } = useClientRecord()
  const isMobile = useIsMobile(768)
  const [messages, setMessages] = useState([])
  const [body, setBody] = useState('')
  const [loadingMessages, setLoadingMessages] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const scrollRef = useRef(null)

  const loadMessages = useCallback(async ({ silent = false } = {}) => {
    if (!clientId) return

    if (!silent) setLoadingMessages(true)
    const { data, error: loadError } = await supabase
      .from('messages')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at')

    if (loadError) {
      if (!silent) {
        setError(loadError.message || 'Could not load messages.')
        setLoadingMessages(false)
      }
      return
    }

    setMessages(data ?? [])
    setLoadingMessages(false)
  }, [clientId])

  useEffect(() => {
    if (clientLoading) return
    const timer = window.setTimeout(() => {
      if (clientError) {
        setError(clientError.message || 'Could not load your account.')
        setLoadingMessages(false)
        return
      }
      if (!clientId) {
        setLoadingMessages(false)
        return
      }
      loadMessages()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [clientLoading, clientError, clientId, loadMessages])

  // Live updates: realtime subscription with a slow polling fallback.
  useEffect(() => {
    if (!clientId) return

    const channel = supabase
      .channel(`client-messages-${clientId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `client_id=eq.${clientId}` },
        payload => {
          setMessages(current => (
            current.some(message => message.id === payload.new.id) ? current : [...current, payload.new]
          ))
        },
      )
      .subscribe()

    const poll = window.setInterval(() => loadMessages({ silent: true }), 30_000)

    return () => {
      supabase.removeChannel(channel)
      window.clearInterval(poll)
    }
  }, [clientId, loadMessages])

  // Keep the newest message in view.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, loadingMessages])

  async function send() {
    if (!body.trim() || !clientId || sending) return

    setSending(true)
    setError('')

    const { data: { session: currentSession } } = await supabase.auth.getSession()
    const res = await supabase.functions.invoke('notify-message', {
      body: { body: body.trim() },
      headers: { Authorization: `Bearer ${currentSession?.access_token}` },
    })

    if (res.error || res.data?.error) {
      setError(res.error?.message || res.data?.error || 'Message failed to send.')
      setSending(false)
      return
    }

    setBody('')
    await loadMessages({ silent: true })
    setSending(false)
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 600, color: '#18181a', marginBottom: 24, letterSpacing: '-0.4px' }}>Messages</h1>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', color: '#dc2626', fontSize: 12, marginBottom: 12 }}>
          {error}
        </div>
      )}

      <div style={{ background: 'white', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', height: isMobile ? 'calc(100vh - 160px)' : 500 }}>
        <div ref={scrollRef} style={{ flex: 1, overflow: 'auto', padding: isMobile ? 14 : 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(loadingMessages || clientLoading) && <div style={{ textAlign: 'center', color: '#7a7888', fontSize: 13, paddingTop: 26 }}>Loading messages…</div>}

          {!loadingMessages && !clientLoading && messages.length === 0 && (
            <div style={{ textAlign: 'center', color: '#7a7888', fontSize: 13, paddingTop: 40 }}>
              No messages yet. Say hello — we typically reply within one business day.
            </div>
          )}

          {!loadingMessages && messages.map(message => (
            <div key={message.id} style={{ display: 'flex', flexDirection: 'column', alignItems: message.from_admin ? 'flex-start' : 'flex-end' }}>
              <div style={{ maxWidth: isMobile ? '85%' : '70%', padding: '10px 14px', borderRadius: 12, fontSize: 13, lineHeight: 1.5, background: message.from_admin ? '#f3f4f6' : '#18181a', color: message.from_admin ? '#18181a' : 'white' }}>
                {message.from_admin && <div style={{ fontSize: 10, fontWeight: 600, color: '#b8906a', marginBottom: 4 }}>Vibefox Studio</div>}
                {message.body}
              </div>
              <div style={{ fontSize: 10, color: '#a8a6b3', marginTop: 3, padding: '0 4px' }}>
                {new Date(message.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: isMobile ? '10px 12px' : '12px 16px', borderTop: '1px solid rgba(0,0,0,0.07)', display: 'flex', gap: 8 }}>
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
      </div>
    </div>
  )
}
