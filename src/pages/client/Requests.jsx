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
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState(null)

  const load = useCallback(async id => {
    const targetClientId = id ?? clientId
    if (!targetClientId) return

    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .eq('client_id', targetClientId)
      .order('created_at', { ascending: false })

    if (error) {
      setNotice({ type: 'error', text: error.message || 'Could not load requests.' })
      setLoading(false)
      return
    }

    setRequests(data ?? [])
    setLoading(false)
  }, [clientId])

  useEffect(() => {
    if (!session) return

    const timer = window.setTimeout(async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', session.user.id)
        .single()

      if (error || !data) {
        setNotice({ type: 'error', text: error?.message || 'Client account not found.' })
        setLoading(false)
        return
      }

      setClientId(data.id)
      load(data.id)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [session, load])

  useEffect(() => {
    if (!notice) return undefined
    const timer = window.setTimeout(() => setNotice(null), 2800)
    return () => window.clearTimeout(timer)
  }, [notice])

  async function submit(event) {
    event.preventDefault()
    if (!clientId || !form.title.trim() || !form.description.trim() || submitting) return

    setSubmitting(true)
    const { error } = await supabase
      .from('requests')
      .insert({
        client_id: clientId,
        title: form.title.trim(),
        description: form.description.trim(),
      })

    if (error) {
      setNotice({ type: 'error', text: error.message || 'Could not submit request.' })
      setSubmitting(false)
      return
    }

    setForm({ title: '', description: '' })
    setNotice({ type: 'success', text: 'Request submitted.' })
    setSubmitting(false)
    load()
  }

  const set = key => event => setForm(current => ({ ...current, [key]: event.target.value }))

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 600, color: '#18181a', marginBottom: 24, letterSpacing: '-0.4px' }}>Requests</h1>

      {notice && (
        <div style={{
          background: notice.type === 'error' ? '#fef2f2' : '#f0fdf4',
          border: `1px solid ${notice.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
          borderRadius: 10,
          padding: '10px 14px',
          fontSize: 13,
          color: notice.type === 'error' ? '#dc2626' : '#16a34a',
          marginBottom: 14,
        }}>
          {notice.text}
        </div>
      )}

      <div style={{ background: 'white', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: '#18181a', marginBottom: 16 }}>Submit a request</h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input placeholder="Title *" value={form.title} onChange={set('title')} required style={inp} />
          <textarea placeholder="Describe what you need *" value={form.description} onChange={set('description')} required rows={4} style={{ ...inp, resize: 'vertical' }} />
          <button type="submit" disabled={submitting || !form.title.trim() || !form.description.trim()} style={{ padding: '11px 20px', borderRadius: 100, border: 'none', background: '#18181a', color: 'white', fontSize: 13, fontWeight: 500, cursor: 'pointer', alignSelf: 'flex-start' }}>
            {submitting ? 'Submitting…' : 'Submit request'}
          </button>
        </form>
      </div>

      <h2 style={{ fontSize: 15, fontWeight: 600, color: '#18181a', marginBottom: 14 }}>Past requests</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading && <div style={{ color: '#7a7888', fontSize: 13 }}>Loading requests…</div>}

        {!loading && requests.length === 0 && (
          <div style={{ color: '#7a7888', fontSize: 13 }}>No requests yet.</div>
        )}

        {!loading && requests.map(request => (
          <div key={request.id} style={{ background: 'white', borderRadius: 12, padding: '16px 20px', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div style={{ fontWeight: 500, fontSize: 13, color: '#18181a' }}>{request.title}</div>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 100, background: STATUS_COLORS[request.status]?.bg, color: STATUS_COLORS[request.status]?.text }}>
                {request.status}
              </span>
            </div>
            <div style={{ fontSize: 13, color: '#7a7888', lineHeight: 1.5 }}>{request.description}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

const inp = { padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)', fontSize: 13, color: '#18181a', background: '#faf9f7', outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' }
