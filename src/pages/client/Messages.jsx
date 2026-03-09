import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/useAuth'
import useIsMobile from '../../components/useIsMobile'

export default function ClientMessages() {
  const session = useAuth()
  const isMobile = useIsMobile(768)
  const [clientId, setClientId] = useState(null)
  const [messages, setMessages] = useState([])
  const [body, setBody] = useState('')
  const [loadingMessages, setLoadingMessages] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const loadMessages = useCallback(async id => {
    const targetClientId = id ?? clientId
    if (!targetClientId) return

    setLoadingMessages(true)
    const { data, error: loadError } = await supabase
      .from('messages')
      .select('*')
      .eq('client_id', targetClientId)
      .order('created_at')

    if (loadError) {
      setError(loadError.message || 'Could not load messages.')
      setLoadingMessages(false)
      return
    }

    setMessages(data ?? [])
    setLoadingMessages(false)
  }, [clientId])

  useEffect(() => {
    if (!session) return

    const timer = window.setTimeout(async () => {
      const { data, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', session.user.id)
        .single()

      if (clientError || !data) {
        setError(clientError?.message || 'Client account not found.')
        setLoadingMessages(false)
        return
      }

      setClientId(data.id)
      loadMessages(data.id)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [session, loadMessages])

  async function send() {
    if (!body.trim() || !clientId || sending) return

    setSending(true)
    setError('')

    const { error: sendError } = await supabase
      .from('messages')
      .insert({ client_id: clientId, body: body.trim(), from_admin: false })

    if (sendError) {
      setError(sendError.message || 'Message failed to send.')
      setSending(false)
      return
    }

    setBody('')
    await loadMessages()
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
        <div style={{ flex: 1, overflow: 'auto', padding: isMobile ? 14 : 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loadingMessages && <div style={{ textAlign: 'center', color: '#7a7888', fontSize: 13, paddingTop: 26 }}>Loading messages…</div>}

          {!loadingMessages && messages.length === 0 && (
            <div style={{ textAlign: 'center', color: '#7a7888', fontSize: 13, paddingTop: 40 }}>No messages yet.</div>
          )}

          {!loadingMessages && messages.map(message => (
            <div key={message.id} style={{ display: 'flex', justifyContent: message.from_admin ? 'flex-start' : 'flex-end' }}>
              <div style={{ maxWidth: isMobile ? '85%' : '70%', padding: '10px 14px', borderRadius: 12, fontSize: 13, lineHeight: 1.5, background: message.from_admin ? '#f3f4f6' : '#18181a', color: message.from_admin ? '#18181a' : 'white' }}>
                {message.from_admin && <div style={{ fontSize: 10, fontWeight: 600, color: '#b8906a', marginBottom: 4 }}>Vibefox Studio</div>}
                {message.body}
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
