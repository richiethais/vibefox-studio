import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { parseFunctionError } from '../lib/supabaseFunctions'
import { useFadeUp } from './useFadeUp'
import useIsMobile from './useIsMobile'

const services = ['Landing Page', 'Business Website', 'Custom Web App', 'E-commerce', 'Retainer', 'Other']
const budgets = ['Under $1,000', '$1,000–$3,000', '$3,000–$10,000', '$10,000+']

export default function Contact() {
  const ref = useFadeUp()
  const isMobile = useIsMobile()
  const [form, setForm] = useState({ name: '', email: '', company: '', service_type: '', budget: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const canSubmit = Boolean(
    form.name.trim() &&
    form.email.trim() &&
    form.service_type &&
    form.budget &&
    form.message.trim()
  )

  function set(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit || loading) return
    setLoading(true)
    setError('')
    const payload = {
      ...form,
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      company: form.company.trim(),
      message: form.message.trim(),
    }
    const { error } = await supabase.functions.invoke('submit-inquiry', {
      body: {
        ...payload,
        form_key: 'contact',
      },
    })

    if (error) {
      const details = await parseFunctionError(error, 'Something went wrong. Please email us directly.')
      setError(details.message)
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)
  }

  return (
    <section id="contact" ref={ref} style={{ padding: isMobile ? '80px 18px' : '96px 40px', background: '#faf9f7' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div className="fade-up d1" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#b8906a', marginBottom: 14 }}>
          Get in touch
        </div>
        <h2 className="fade-up d2" style={{ fontFamily: '"DM Serif Display", serif', fontSize: 'clamp(32px, 5vw, 48px)', lineHeight: 1.08, color: '#18181a', letterSpacing: '-1.2px', margin: '0 0 14px' }}>
          Start a project
        </h2>
        <p className="fade-up d3" style={{ fontSize: isMobile ? 15 : 16, color: '#7a7888', marginBottom: isMobile ? 30 : 40, fontWeight: 300, lineHeight: 1.6 }}>
          Tell us what you need and our Jacksonville digital marketing team will be in touch within 24 hours.
        </p>

        {done ? (
          <div className="fade-up" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 14, padding: '32px', textAlign: 'center' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', border: '1.5px solid #16a34a', margin: '0 auto 12px', position: 'relative' }}>
              <span style={{ position: 'absolute', inset: 6, borderRadius: '50%', background: '#16a34a' }} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 500, color: '#15803d', marginBottom: 6 }}>Message sent!</div>
            <div style={{ fontSize: 14, color: '#16a34a' }}>We'll get back to you within 24 hours.</div>
          </div>
        ) : (
          <form className="fade-up d4" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
              <input placeholder="Your name *" value={form.name} onChange={set('name')} required style={inp} />
              <input placeholder="Email address *" type="email" value={form.email} onChange={set('email')} required style={inp} />
            </div>
            <input placeholder="Company (optional)" value={form.company} onChange={set('company')} style={inp} />
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
              <select value={form.service_type} onChange={set('service_type')} required style={inp}>
                <option value="">Service interest *</option>
                {services.map(s => <option key={s}>{s}</option>)}
              </select>
              <select value={form.budget} onChange={set('budget')} required style={inp}>
                <option value="">Budget range *</option>
                {budgets.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <textarea
              placeholder="Tell us about your project *"
              value={form.message}
              onChange={set('message')}
              required
              rows={5}
              style={{ ...inp, resize: 'vertical' }}
            />
            {error && <p style={{ fontSize: 13, color: '#dc2626', margin: 0 }}>{error}</p>}
            <button type="submit" disabled={loading || !canSubmit} style={{
              padding: '14px 28px', borderRadius: 100, border: 'none',
              background: '#18181a', color: 'white', fontSize: 15, fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
              alignSelf: isMobile ? 'stretch' : 'flex-start', transition: 'all 0.2s',
            }}>
              {loading ? 'Sending…' : 'Send message →'}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}

const inp = {
  padding: '12px 16px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)',
  fontSize: 14, color: '#18181a', background: 'white', outline: 'none',
  width: '100%', boxSizing: 'border-box', fontFamily: 'inherit',
}
