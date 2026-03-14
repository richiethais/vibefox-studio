import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/useAuth'
import { parseFunctionError } from '../../lib/supabaseFunctions'

const STATUS_COLORS = {
  done: { bg: '#dcfce7', text: '#16a34a' },
  'in-progress': { bg: '#fef3c7', text: '#d97706' },
  open: { bg: '#dbeafe', text: '#1d4ed8' },
}

const FAQ_ITEMS = [
  {
    a: "Head to the Projects page — you'll see current progress and any milestones there.",
    q: 'How do I check my project status?',
  },
  {
    a: 'Go to the Invoices page and click "Open invoice" or "Open payment link" next to the invoice.',
    q: 'How do I pay an invoice?',
  },
  {
    a: 'We typically respond within 1 business day. For urgent matters, feel free to reach out directly.',
    q: 'How long until I get a reply?',
  },
  {
    a: "Yes — use the form below to describe what you need and we'll get back to you.",
    q: 'Can I request changes to my project?',
  },
  {
    a: "Send us a message using the form below and we'll update it on our end.",
    q: 'How do I update my contact info?',
  },
]

export default function ClientSupport() {
  const session = useAuth()
  const [clientId, setClientId] = useState(null)
  const [requests, setRequests] = useState([])
  const [form, setForm] = useState({ description: '', title: '' })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState(null)
  const [openFaq, setOpenFaq] = useState(null)

  const load = useCallback(async id => {
    const targetClientId = id ?? clientId
    if (!targetClientId) return

    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .eq('client_id', targetClientId)
      .order('created_at', { ascending: false })

    if (error) {
      setNotice({ text: error.message || 'Could not load submissions.', type: 'error' })
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
        setNotice({ text: error?.message || 'Client account not found.', type: 'error' })
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
    const timer = window.setTimeout(() => setNotice(null), 3000)
    return () => window.clearTimeout(timer)
  }, [notice])

  async function submit(event) {
    event.preventDefault()
    if (!clientId || !form.title.trim() || !form.description.trim() || submitting) return

    setSubmitting(true)

    try {
      const { error } = await supabase.functions.invoke('submit-support', {
        body: {
          description: form.description.trim(),
          title: form.title.trim(),
        },
      })

      if (error) {
        const { message } = await parseFunctionError(error, 'Could not submit support request.')
        setNotice({ text: message, type: 'error' })
        return
      }

      setForm({ description: '', title: '' })
      setNotice({ text: "Message sent. We'll get back to you soon.", type: 'success' })
      load()
    } catch {
      setNotice({ text: 'Could not submit support request.', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const set = key => event => setForm(current => ({ ...current, [key]: event.target.value }))
  const toggleFaq = index => setOpenFaq(current => (current === index ? null : index))

  return (
    <div>
      <h1 style={{ color: '#18181a', fontSize: 22, fontWeight: 600, letterSpacing: '-0.4px', marginBottom: 24 }}>Support</h1>

      {notice && (
        <div style={{
          background: notice.type === 'error' ? '#fef2f2' : '#f0fdf4',
          border: `1px solid ${notice.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
          borderRadius: 10,
          color: notice.type === 'error' ? '#dc2626' : '#16a34a',
          fontSize: 13,
          marginBottom: 14,
          padding: '10px 14px',
        }}>
          {notice.text}
        </div>
      )}

      {/* FAQ accordion */}
      <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, marginBottom: 24, overflow: 'hidden' }}>
        <div style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', padding: '18px 24px 14px' }}>
          <h2 style={{ color: '#18181a', fontSize: 15, fontWeight: 600, margin: 0 }}>Frequently asked questions</h2>
        </div>
        {FAQ_ITEMS.map((item, index) => (
          <div key={index} style={{ borderBottom: index < FAQ_ITEMS.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
            <button
              aria-expanded={openFaq === index}
              onClick={() => toggleFaq(index)}
              style={{
                alignItems: 'center',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                gap: 12,
                justifyContent: 'space-between',
                padding: '14px 24px',
                textAlign: 'left',
                width: '100%',
              }}
            >
              <span style={{ color: '#18181a', fontSize: 13, fontWeight: 500 }}>{item.q}</span>
              <span style={{ color: '#7a7888', flexShrink: 0, fontSize: 18, fontWeight: 300, lineHeight: 1 }}>
                {openFaq === index ? '−' : '+'}
              </span>
            </button>
            {openFaq === index && (
              <div style={{ color: '#7a7888', fontSize: 13, lineHeight: 1.6, padding: '0 24px 16px' }}>
                {item.a}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Contact form */}
      <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, marginBottom: 24, padding: 24 }}>
        <h2 style={{ color: '#18181a', fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Send a message</h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            onChange={set('title')}
            placeholder="Subject *"
            required
            style={inp}
            value={form.title}
          />
          <textarea
            onChange={set('description')}
            placeholder="Describe what you need *"
            required
            rows={4}
            style={{ ...inp, resize: 'vertical' }}
            value={form.description}
          />
          <button
            disabled={submitting || !form.title.trim() || !form.description.trim()}
            style={{
              alignSelf: 'flex-start',
              background: '#18181a',
              border: 'none',
              borderRadius: 100,
              color: 'white',
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontSize: 13,
              fontWeight: 500,
              opacity: submitting ? 0.6 : 1,
              padding: '11px 20px',
            }}
            type="submit"
          >
            {submitting ? 'Sending…' : 'Send message'}
          </button>
        </form>
      </div>

      {/* Submission history */}
      <h2 style={{ color: '#18181a', fontSize: 15, fontWeight: 600, marginBottom: 14 }}>Past submissions</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading && <div style={{ color: '#7a7888', fontSize: 13 }}>Loading…</div>}

        {!loading && requests.length === 0 && (
          <div style={{ color: '#7a7888', fontSize: 13 }}>No submissions yet.</div>
        )}

        {!loading && requests.map(request => (
          <div key={request.id} style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ alignItems: 'flex-start', display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ color: '#18181a', fontSize: 13, fontWeight: 500 }}>{request.title}</div>
              <span style={{
                background: STATUS_COLORS[request.status]?.bg || '#f3f4f6',
                borderRadius: 100,
                color: STATUS_COLORS[request.status]?.text || '#6b7280',
                fontSize: 11,
                fontWeight: 600,
                marginLeft: 8,
                padding: '3px 9px',
                whiteSpace: 'nowrap',
              }}>
                {request.status}
              </span>
            </div>
            <div style={{ color: '#7a7888', fontSize: 13, lineHeight: 1.5 }}>{request.description}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

const inp = {
  background: '#faf9f7',
  border: '1px solid rgba(0,0,0,0.1)',
  borderRadius: 10,
  boxSizing: 'border-box',
  color: '#18181a',
  fontFamily: 'inherit',
  fontSize: 13,
  outline: 'none',
  padding: '11px 14px',
  width: '100%',
}
