import { useState } from 'react'
import MarketingLayout from '../../components/marketing/MarketingLayout'
import SEOHead from '../../components/SEOHead'
import useIsMobile from '../../components/useIsMobile'
import { supabase } from '../../lib/supabase'
import { parseFunctionError } from '../../lib/supabaseFunctions'

const SERVICES = [
  'Landing Page',
  'Business Website',
  'Custom Web App',
  'E-commerce',
  'Growth Plan',
  'Other',
]

const BUDGETS = [
  'Under $1,000',
  '$1,000–$3,000',
  '$3,000–$10,000',
  '$10,000+',
]

const inputStyle = {
  padding: '12px 16px',
  borderRadius: 10,
  border: '1px solid rgba(0,0,0,0.1)',
  fontSize: 14,
  background: '#fff',
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  outline: 'none',
}

const trustCards = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b8906a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: 'Quick response',
    description: 'We typically reply within 24 hours — often same day.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b8906a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    title: 'Jacksonville, FL',
    description: 'Local team. We know the market and the businesses here.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b8906a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: 'No pressure',
    description: 'Just a real conversation about your goals. No sales pitch.',
  },
]

export default function ContactPage() {
  const isMobile = useIsMobile()
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    service_type: '',
    budget: '',
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { error: fnError } = await supabase.functions.invoke('submit-inquiry', {
        body: { ...form, form_key: 'contact' },
      })
      if (fnError) {
        const parsed = await parseFunctionError(fnError, 'Failed to send message.')
        throw new Error(parsed.message)
      }
      setSent(true)
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MarketingLayout hideCTA>
      <SEOHead
        title="Contact VibefoxStudio | Jacksonville Digital Marketing Agency"
        description="Get in touch with Vibefox Studio. We typically respond within 24 hours."
        path="/contact"
      />

      <section style={{ padding: isMobile ? '128px 18px 72px' : '160px 40px 96px', maxWidth: 1100, margin: '0 auto' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 48 : 64 }}>
          <p className="anim-rise-1" style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5, color: '#b8906a', marginBottom: 12 }}>
            Get in touch
          </p>
          <h1 className="anim-rise-2" style={{ fontSize: isMobile ? 32 : 48, fontWeight: 700, margin: '0 0 16px', lineHeight: 1.15 }}>
            Let's build something <em style={{ fontStyle: 'italic', color: '#b8906a' }}>great.</em>
          </h1>
          <p className="anim-rise-3" style={{ fontSize: isMobile ? 15 : 17, color: '#666', maxWidth: 500, margin: '0 auto' }}>
            Tell us about your project and we'll get back to you within 24 hours.
          </p>
        </div>

        {/* Two-column grid */}
        <div
          className="anim-rise-4"
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 340px',
            gap: isMobile ? 32 : 48,
            alignItems: 'start',
          }}
        >
          {/* Trust signals */}
          <div style={{ order: isMobile ? -1 : 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {trustCards.map((card) => (
              <div
                key={card.title}
                style={{
                  background: '#faf9f7',
                  border: '1px solid rgba(0,0,0,0.08)',
                  borderRadius: 14,
                  padding: '18px 20px',
                  display: 'flex',
                  gap: 14,
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: 'rgba(200,169,126,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {card.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{card.title}</div>
                  <div style={{ fontSize: 13, color: '#666', lineHeight: 1.45 }}>{card.description}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Form */}
          <div style={{ order: isMobile ? 0 : 0 }}>
            {sent ? (
              <div style={{ textAlign: 'center', padding: '64px 24px' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#e6f4ea', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#34a853" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>Message sent!</h2>
                <p style={{ fontSize: 15, color: '#666' }}>We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <input
                  type="text"
                  placeholder="Name"
                  required
                  value={form.name}
                  onChange={update('name')}
                  style={inputStyle}
                />
                <input
                  type="email"
                  placeholder="Email"
                  required
                  value={form.email}
                  onChange={update('email')}
                  style={inputStyle}
                />
                <input
                  type="text"
                  placeholder="Company (optional)"
                  value={form.company}
                  onChange={update('company')}
                  style={inputStyle}
                />
                <select
                  value={form.service_type}
                  onChange={update('service_type')}
                  required
                  style={{ ...inputStyle, color: form.service_type ? '#111' : '#888', appearance: 'none' }}
                >
                  <option value="" disabled>Service</option>
                  {SERVICES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <select
                  value={form.budget}
                  onChange={update('budget')}
                  required
                  style={{ ...inputStyle, color: form.budget ? '#111' : '#888', appearance: 'none' }}
                >
                  <option value="" disabled>Budget</option>
                  {BUDGETS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                <textarea
                  placeholder="Tell us about your project..."
                  required
                  rows={5}
                  value={form.message}
                  onChange={update('message')}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
                {error && (
                  <p style={{ color: '#d93025', fontSize: 13, margin: 0 }}>{error}</p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '13px 24px',
                    borderRadius: 10,
                    background: '#111',
                    color: '#fff',
                    fontSize: 15,
                    fontWeight: 600,
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                    fontFamily: 'inherit',
                  }}
                >
                  {loading ? 'Sending...' : 'Send message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </MarketingLayout>
  )
}
