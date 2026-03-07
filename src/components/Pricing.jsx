import { useFadeUp } from './useFadeUp'
import { Eyebrow, h2Style, subStyle } from './Services'

const plans = [
  {
    name: 'Starter', price: '200', desc: 'Keep your site running reliably.',
    features: ['Hosting & SSL certificate', 'Uptime monitoring', 'Security updates', 'Database management', 'Minor content updates', '48-hour support response'],
    featured: false,
  },
  {
    name: 'Growth', price: '500', desc: 'For businesses that want to grow.',
    features: ['Everything in Starter', 'SEO optimization', '2 blog posts per month', 'Search Console monitoring', 'Monthly performance report', 'Minor design updates', '24-hour priority support'],
    featured: true, badge: 'Most popular',
  },
  {
    name: 'Pro', price: '900', desc: 'Full-service digital partner.',
    features: ['Everything in Growth', '4 blog posts per month', 'Active link building', 'Quarterly section redesign', 'Conversion optimization', 'Same-day priority support', 'Monthly strategy call'],
    featured: false,
  },
]

export default function Pricing() {
  const ref = useFadeUp()

  return (
    <section id="pricing" ref={ref} style={{ padding: '96px 40px' }}>
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>
        <Eyebrow icon="💳">Retainer plans</Eyebrow>
        <h2 className="fade-up d1" style={h2Style}>Simple, honest <em style={{ fontStyle: 'italic', color: '#b8906a' }}>monthly pricing.</em></h2>
        <p className="fade-up d2" style={subStyle}>Month-to-month. No contracts. Cancel anytime. Project quotes separate.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginTop: 52, alignItems: 'start' }}>
          {plans.map((p, i) => <PricingCard key={p.name} plan={p} delay={`d${i + 1}`} />)}
        </div>

        <p className="fade-up" style={{ textAlign: 'center', marginTop: 22, fontSize: 13, color: '#7a7888' }}>
          One-time project pricing from $1,500 —{' '}
          <a href="mailto:richie@vibefoxstudio.com" style={{ color: '#b8906a', textDecoration: 'none' }}>get a custom quote →</a>
        </p>
      </div>
    </section>
  )
}

function PricingCard({ plan, delay }) {
  const { name, price, desc, features, featured, badge } = plan

  return (
    <div
      className={`fade-up ${delay}`}
      style={{
        background: featured ? '#18181a' : '#faf9f7',
        border: featured ? 'none' : '1px solid rgba(0,0,0,0.08)',
        borderRadius: 16, padding: '30px 26px',
        position: 'relative',
        boxShadow: featured ? '0 8px 36px rgba(0,0,0,0.15)' : 'none',
        transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; if (!featured) e.currentTarget.style.boxShadow = '0 14px 40px rgba(0,0,0,0.07)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; if (!featured) e.currentTarget.style.boxShadow = 'none' }}
    >
      {badge && (
        <div style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', background: '#b8906a', color: 'white', fontSize: 10, fontWeight: 700, padding: '3px 13px', borderRadius: 100, textTransform: 'uppercase', letterSpacing: '0.8px', whiteSpace: 'nowrap' }}>
          {badge}
        </div>
      )}

      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: featured ? 'rgba(255,255,255,0.32)' : '#7a7888', marginBottom: 14 }}>{name}</div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 6 }}>
        <span style={{ fontSize: 16, color: featured ? 'rgba(255,255,255,0.35)' : '#7a7888', fontWeight: 400, marginTop: 8 }}>$</span>
        <span style={{ fontFamily: '"DM Serif Display", serif', fontSize: 54, color: featured ? 'white' : '#18181a', letterSpacing: '-2px', lineHeight: 1 }}>{price}</span>
        <span style={{ fontSize: 13, color: featured ? 'rgba(255,255,255,0.32)' : '#7a7888', alignSelf: 'flex-end', marginBottom: 4 }}>/mo</span>
      </div>

      <div style={{ fontSize: 13, color: featured ? 'rgba(255,255,255,0.38)' : '#7a7888', marginBottom: 22, lineHeight: 1.5, fontWeight: 300 }}>{desc}</div>
      <div style={{ height: 1, background: featured ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', marginBottom: 18 }} />

      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 26px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {features.map(f => (
          <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 13, color: featured ? 'rgba(255,255,255,0.62)' : '#3a3840', lineHeight: 1.4, fontWeight: 300 }}>
            <span style={{ width: 16, height: 16, background: featured ? 'rgba(200,169,126,0.2)' : 'rgba(200,169,126,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: featured ? '#c8a97e' : '#b8906a', flexShrink: 0, marginTop: 1 }}>✓</span>
            {f}
          </li>
        ))}
      </ul>

      <a
        href="mailto:richie@vibefoxstudio.com"
        style={{
          display: 'block', textAlign: 'center', padding: 12, borderRadius: 100,
          fontSize: 14, fontWeight: 500, textDecoration: 'none', transition: 'all 0.2s',
          background: featured ? '#b8906a' : 'transparent',
          border: featured ? '1.5px solid #b8906a' : '1.5px solid rgba(0,0,0,0.08)',
          color: featured ? 'white' : '#18181a',
          boxShadow: featured ? '0 4px 14px rgba(184,144,106,0.3)' : 'none',
        }}
        onMouseEnter={e => {
          if (featured) { e.currentTarget.style.background = '#c8a97e'; e.currentTarget.style.transform = 'translateY(-1px)' }
          else e.currentTarget.style.background = '#edeae5'
        }}
        onMouseLeave={e => {
          if (featured) { e.currentTarget.style.background = '#b8906a'; e.currentTarget.style.transform = 'none' }
          else e.currentTarget.style.background = 'transparent'
        }}
      >
        Get started
      </a>
    </div>
  )
}
