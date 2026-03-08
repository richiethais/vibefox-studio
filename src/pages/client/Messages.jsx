import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/useAuth'

export default function ClientMessages() {
  const session = useAuth()
  const [clientId, setClientId] = useState(null)
  const [messages, setMessages] = useState([])
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  const loadMessages = useCallback(async (id) => {
    const targetClientId = id ?? clientId
    if (!targetClientId) return
    const { data } = await supabase.from('messages').select('*').eq('client_id', targetClientId).order('created_at')
    setMessages(data ?? [])
  }, [clientId])

  useEffect(() => {
    if (!session) return
    supabase.from('clients').select('id').eq('user_id', session.user.id).single().then(({ data }) => {
      if (data) { setClientId(data.id); loadMessages(data.id) }
    })
  }, [session, loadMessages])

  async function send() {
    if (!body.trim() || !clientId) return
    setSending(true)
    await supabase.from('messages').insert({ client_id: clientId, body, from_admin: false })
    setBody('')
    await loadMessages()
    setSending(false)
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 600, color: '#18181a', marginBottom: 24, letterSpacing: '-0.4px' }}>Messages</h1>
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', height: 500 }}>
        <div style={{ flex: 1, overflow: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: '#7a7888', fontSize: 13, paddingTop: 40 }}>No messages yet.</div>
          )}
          {messages.map(m => (
            <div key={m.id} style={{ display: 'flex', justifyContent: m.from_admin ? 'flex-start' : 'flex-end' }}>
              <div style={{
                maxWidth: '70%', padding: '10px 14px', borderRadius: 12, fontSize: 13, lineHeight: 1.5,
                background: m.from_admin ? '#f3f4f6' : '#18181a',
                color: m.from_admin ? '#18181a' : 'white',
              }}>
                {m.from_admin && <div style={{ fontSize: 10, fontWeight: 600, color: '#b8906a', marginBottom: 4 }}>Vibefox Studio</div>}
                {m.body}
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(0,0,0,0.07)', display: 'flex', gap: 10 }}>
          <input
            value={body}
            onChange={e => setBody(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Type a message…"
            style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)', fontSize: 13, outline: 'none', background: '#faf9f7' }}
          />
          <button onClick={send} disabled={sending} style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: '#18181a', color: 'white', fontSize: 13, cursor: 'pointer' }}>
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
