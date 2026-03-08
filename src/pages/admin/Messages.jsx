import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function AdminMessages() {
  const [clients, setClients] = useState([])
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    supabase.from('clients').select('id, name, email').order('name').then(({ data }) => setClients(data ?? []))
  }, [])

  useEffect(() => {
    if (!selected) return
    loadMessages()
  }, [selected])

  async function loadMessages() {
    const { data } = await supabase.from('messages').select('*').eq('client_id', selected.id).order('created_at')
    setMessages(data ?? [])
  }

  async function send() {
    if (!body.trim()) return
    setSending(true)
    await supabase.from('messages').insert({ client_id: selected.id, body, from_admin: true })
    setBody('')
    await loadMessages()
    setSending(false)
  }

  return (
    <div style={{ padding: '36px 40px', height: 'calc(100vh - 0px)', display: 'flex', flexDirection: 'column' }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, color: '#18181a', marginBottom: 24, letterSpacing: '-0.4px' }}>Messages</h1>
      <div style={{ display: 'flex', gap: 16, flex: 1, overflow: 'hidden' }}>
        <div style={{ width: 220, background: 'white', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', overflow: 'auto', flexShrink: 0 }}>
          {clients.map(c => (
            <div
              key={c.id}
              onClick={() => setSelected(c)}
              style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid rgba(0,0,0,0.04)', background: selected?.id === c.id ? '#f8f6f2' : 'white' }}
            >
              <div style={{ fontSize: 13, fontWeight: 500, color: '#18181a' }}>{c.name}</div>
              <div style={{ fontSize: 11, color: '#7a7888', marginTop: 2 }}>{c.email}</div>
            </div>
          ))}
        </div>

        <div style={{ flex: 1, background: 'white', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
                {messages.map(m => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: m.from_admin ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '70%', padding: '10px 14px', borderRadius: 12, fontSize: 13, lineHeight: 1.5,
                      background: m.from_admin ? '#18181a' : '#f3f4f6',
                      color: m.from_admin ? 'white' : '#18181a',
                    }}>
                      {m.body}
                      <div style={{ fontSize: 10, opacity: 0.5, marginTop: 4, textAlign: 'right' }}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
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
            </>
          )}
        </div>
      </div>
    </div>
  )
}
