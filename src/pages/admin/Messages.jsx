import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import useIsMobile from '../../components/useIsMobile'

export default function AdminMessages() {
  const [clients, setClients] = useState([])
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [body, setBody] = useState('')
  const [loadingClients, setLoadingClients] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const isMobile = useIsMobile(768)

  useEffect(() => {
    let active = true

    const timer = window.setTimeout(async () => {
      const { data, error: loadError } = await supabase
        .from('clients')
        .select('id, name, email')
        .order('name')

      if (!active) return

      if (loadError) {
        setError(loadError.message || 'Failed to load clients.')
      } else {
        setClients(data ?? [])
      }

      setLoadingClients(false)
    }, 0)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [])

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

    const timer = window.setTimeout(() => {
      loadMessages(selected.id)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [selected, loadMessages])

  async function send() {
    if (!selected || !body.trim() || sending) return

    setSending(true)
    setError('')

    const { error: sendError } = await supabase
      .from('messages')
      .insert({ client_id: selected.id, body: body.trim(), from_admin: true })

    if (sendError) {
      setError(sendError.message || 'Message failed to send.')
      setSending(false)
      return
    }

    setBody('')
    await loadMessages(selected.id)
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
        <div style={{ width: isMobile ? '100%' : 220, background: 'white', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', overflow: 'auto', flexShrink: isMobile ? undefined : 0, maxHeight: isMobile && selected ? 160 : undefined }}>
          {loadingClients && (
            <div style={{ padding: '14px 16px', fontSize: 12, color: '#7a7888' }}>Loading clients…</div>
          )}

          {!loadingClients && clients.length === 0 && (
            <div style={{ padding: '14px 16px', fontSize: 12, color: '#7a7888' }}>No clients available.</div>
          )}

          {!loadingClients && clients.map(client => (
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
              <div style={{ fontSize: 13, fontWeight: 500, color: '#18181a' }}>{client.name}</div>
              <div style={{ fontSize: 11, color: '#7a7888', marginTop: 2 }}>{client.email}</div>
            </button>
          ))}
        </div>

        <div style={{ flex: 1, background: 'white', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: isMobile ? 400 : undefined }}>
          {!selected ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7a7888', fontSize: 14 }}>
              Select a client to view messages
            </div>
          ) : (
            <>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(0,0,0,0.07)', fontWeight: 500, fontSize: 14, color: '#18181a' }}>
                {selected.name}
              </div>

              <div style={{ flex: 1, overflow: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
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
