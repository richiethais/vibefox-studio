import { useFadeUp } from './useFadeUp'

const services = [
  { icon: '🌐', title: 'Landing Pages', desc: 'High-converting single pages built for speed. Perfect for campaigns, launches, and service businesses that need results fast.' },
  { icon: '🏢', title: 'Business Websites', desc: 'Multi-page sites that rank on Google, tell your story, and turn visitors into customers. Includes CMS for easy updates.' },
  { icon: '⚙️', title: 'Custom Web Apps', desc: 'Booking systems, client portals, dashboards with real logins, live data, and file uploads. From $4,000.' },
  { icon: '📈', title: 'SEO & Content', desc: 'Weekly blog posts and on-page optimization that compound over time — organic traffic without paying per click.' },
  { icon: '🔒', title: 'Hosting & Security', desc: 'Fast global hosting, SSL, backups, uptime monitoring, and security updates. All handled for you.' },
  { icon: '🛠', title: 'Ongoing Support', desc: 'Hours, photos, copy — small updates within 48 hours. No tickets, no waiting, no surprise invoices.' },
]

export default function Services() {
  const ref = useFadeUp()

  return (
    <section id="services" ref={ref} style={{ padding: '96px 40px' }}>
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>
        <Eyebrow icon="⚡">What we build</Eyebrow>
        <h2 className="fade-up d1" style={h2Style}>Everything your business needs <em style={{ fontStyle: 'italic', color: '#b8906a' }}>online.</em></h2>
        <p className="fade-up d2" style={subStyle}>Landing pages to custom apps — built fast, launched clean, maintained long-term.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginTop: 52 }}>
          {services.map((s, i) => (
            <ServiceCard key={s.title} {...s} delay={`d${(i % 6) + 1}`} />
          ))}
        </div>
      </div>
    </section>
  )
}

function ServiceCard({ icon, title, desc, delay }) {
  return (
    <div
      className={`fade-up ${delay}`}
      style={{
        background: '#faf9f7', border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: 16, padding: 26,
        transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)',
        position: 'relative', overflow: 'hidden',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(200,169,126,0.3)'
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.06)'
        e.currentTarget.querySelector('.gold-bar').style.opacity = '1'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)'
        e.currentTarget.style.transform = 'none'
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.querySelector('.gold-bar').style.opacity = '0'
      }}
    >
      <div className="gold-bar" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #c8a97e, transparent)', opacity: 0, transition: 'opacity 0.3s' }} />
      <div style={{ width: 40, height: 40, background: '#f5f3f0', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 16, border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
        {icon}
      </div>
      <div style={{ fontSize: 15.5, fontWeight: 600, color: '#18181a', marginBottom: 8, letterSpacing: '-0.3px' }}>{title}</div>
      <div style={{ fontSize: 14, color: '#7a7888', lineHeight: 1.58, fontWeight: 300 }}>{desc}</div>
    </div>
  )
}

export function Eyebrow({ icon, children }) {
  return (
    <div className="fade-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 500, color: '#b8906a', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 18 }}>
      <span style={{ width: 20, height: 20, background: 'rgba(200,169,126,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>{icon}</span>
      {children}
    </div>
  )
}

export const h2Style = {
  fontFamily: '"DM Serif Display", serif',
  fontSize: 'clamp(36px, 5vw, 56px)',
  lineHeight: 1.04, color: '#18181a', letterSpacing: '-1.5px', margin: 0,
}

export const subStyle = {
  fontSize: 17, color: '#7a7888', maxWidth: 450, marginTop: 14, fontWeight: 300, lineHeight: 1.68,
}
