import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/useAuth'

const STATUS_COLORS = {
  open: { bg: '#dbeafe', text: '#1d4ed8' },
  'in-progress': { bg: '#fef3c7', text: '#d97706' },
  done: { bg: '#dcfce7', text: '#16a34a' },
}

export default function ClientRequests() {
  const session = useAuth()
  const [clientId, setClientId] = useState(null)
  const [requests, setRequests] = useState([])
  const [form, setForm] = useState({ title: '', description: '' })
  const [submitted, setSubmitted] = useState(false)

  const load = useCallback(async (id) => {
    const targetClientId = id ?? clientId
    if (!targetClientId) return
    const { data } = await supabase.from('requests').select('*').eq('client_id', targetClientId).order('created_at', { ascending: false })
    setRequests(data ?? [])
  }, [clientId])

  useEffect(() => {
    if (!session) return
    supabase.from('clients').select('id').eq('user_id', session.user.id).single().then(({ data }) => {
      if (data) { setClientId(data.id); load(data.id) }
    })
  }, [session, load])

  async function submit(e) {
    e.preventDefault()
    if (!clientId) return
    await supabase.from('requests').insert({ ...form, client_id: clientId })
    setForm({ title: '', description: '' })
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
    load()
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 600, color: '#18181a', marginBottom: 24, letterSpacing: '-0.4px' }}>Requests</h1>

      <div style={{ background: 'white', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: '#18181a', marginBottom: 16 }}>Submit a request</h2>
        {submitted ? (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#16a34a' }}>Request submitted!</div>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input placeholder="Title *" value={form.title} onChange={set('title')} required style={inp} />
            <textarea placeholder="Describe what you need *" value={form.description} onChange={set('description')} required rows={4} style={{ ...inp, resize: 'vertical' }} />
            <button type="submit" style={{ padding: '11px 20px', borderRadius: 100, border: 'none', background: '#18181a', color: 'white', fontSize: 13, fontWeight: 500, cursor: 'pointer', alignSelf: 'flex-start' }}>
              Submit request
            </button>
          </form>
        )}
      </div>

      <h2 style={{ fontSize: 15, fontWeight: 600, color: '#18181a', marginBottom: 14 }}>Past requests</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {requests.map(r => (
          <div key={r.id} style={{ background: 'white', borderRadius: 12, padding: '16px 20px', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div style={{ fontWeight: 500, fontSize: 13, color: '#18181a' }}>{r.title}</div>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 100, background: STATUS_COLORS[r.status]?.bg, color: STATUS_COLORS[r.status]?.text }}>{r.status}</span>
            </div>
            <div style={{ fontSize: 13, color: '#7a7888', lineHeight: 1.5 }}>{r.description}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

const inp = { padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)', fontSize: 13, color: '#18181a', background: '#faf9f7', outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' }
