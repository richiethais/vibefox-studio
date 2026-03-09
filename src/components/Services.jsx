import { useFadeUp } from './useFadeUp'
import Eyebrow from './Eyebrow'
import { h2Style, subStyle } from './sectionStyles'
import useIsMobile from './useIsMobile'

const services = [
  { iconKey: 'landing', title: 'Landing Pages', desc: 'High-converting single pages built for speed. Perfect for campaigns, launches, and service businesses that need results fast.' },
  { iconKey: 'website', title: 'Business Websites', desc: 'Multi-page sites that rank on Google, tell your story, and turn visitors into customers. Includes CMS for easy updates.' },
  { iconKey: 'app', title: 'Custom Web Apps', desc: 'Booking systems, client portals, dashboards with real logins, live data, and file uploads. From $4,000.' },
  { iconKey: 'seo', title: 'SEO & Content', desc: 'Weekly blog posts and on-page optimization that compound over time - organic traffic without paying per click.' },
  { iconKey: 'security', title: 'Hosting & Security', desc: 'Fast global hosting, SSL, backups, uptime monitoring, and security updates. All handled for you.' },
  { iconKey: 'support', title: 'Ongoing Support', desc: 'Hours, photos, copy - small updates within 48 hours. No tickets, no waiting, no surprise invoices.' },
]

export default function Services() {
  const ref = useFadeUp()
  const isMobile = useIsMobile()

  return (
    <section id="services" ref={ref} style={{ padding: isMobile ? '80px 18px' : '96px 40px' }}>
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>
        <Eyebrow>What we build</Eyebrow>
        <h2 className="fade-up d1" style={{ ...h2Style, fontSize: isMobile ? 'clamp(30px, 10vw, 44px)' : h2Style.fontSize, letterSpacing: isMobile ? '-1px' : h2Style.letterSpacing }}>Everything your business needs <em style={{ fontStyle: 'italic', color: '#b8906a' }}>online.</em></h2>
        <p className="fade-up d2" style={{ ...subStyle, fontSize: isMobile ? 15 : subStyle.fontSize, maxWidth: isMobile ? 360 : subStyle.maxWidth, lineHeight: isMobile ? 1.58 : subStyle.lineHeight }}>Landing pages to custom apps - built fast, launched clean, maintained long-term.</p>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 14, marginTop: isMobile ? 36 : 52 }}>
          {services.map((service, i) => (
            <ServiceCard key={service.title} {...service} delay={`d${(i % 6) + 1}`} isMobile={isMobile} />
          ))}
        </div>
      </div>
    </section>
  )
}

function ServiceCard({ iconKey, title, desc, delay, isMobile }) {
  return (
    <div
      className={`fade-up ${delay}`}
      style={{
        background: '#faf9f7', border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: 16, padding: isMobile ? 22 : 26,
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
      <div style={{ width: 40, height: 40, background: '#f5f3f0', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
        <ServiceGlyph iconKey={iconKey} />
      </div>
      <div style={{ fontSize: 15.5, fontWeight: 600, color: '#18181a', marginBottom: 8, letterSpacing: '-0.3px' }}>{title}</div>
      <div style={{ fontSize: 14, color: '#7a7888', lineHeight: 1.58, fontWeight: 300 }}>{desc}</div>
    </div>
  )
}

function ServiceGlyph({ iconKey }) {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: '#b8906a', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }

  if (iconKey === 'landing') {
    return (
      <svg {...common}>
        <rect x="3" y="4" width="18" height="14" rx="2" />
        <path d="M3 9h18" />
        <circle cx="8" cy="6.5" r="0.7" fill="#b8906a" stroke="none" />
        <path d="M10 13c1.1-1.2 2.6-1.8 4-1.8 1.4 0 2.9.6 4 1.8" />
        <path d="M14 11.2v3.8" />
      </svg>
    )
  }

  if (iconKey === 'website') {
    return (
      <svg {...common}>
        <path d="M4 20V8l8-4 8 4v12" />
        <path d="M9 20v-6h6v6" />
        <path d="M8 10h.01M12 10h.01M16 10h.01" />
      </svg>
    )
  }

  if (iconKey === 'app') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="2.5" />
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.8 5.8l2.1 2.1M16.1 16.1l2.1 2.1M18.2 5.8l-2.1 2.1M7.9 16.1l-2.1 2.1" />
      </svg>
    )
  }

  if (iconKey === 'seo') {
    return (
      <svg {...common}>
        <path d="M4 19h16" />
        <path d="M7 15l3-3 3 2 4-5" />
        <path d="M17 9h3v3" />
      </svg>
    )
  }

  if (iconKey === 'security') {
    return (
      <svg {...common}>
        <path d="M12 3l7 3v6c0 5-3.5 8.5-7 9-3.5-.5-7-4-7-9V6l7-3z" />
        <path d="M9.5 12.5l2 2 3-3.5" />
      </svg>
    )
  }

  return (
    <svg {...common}>
      <path d="M4 14v-1a8 8 0 0116 0v1" />
      <rect x="3" y="14" width="4" height="6" rx="1.5" />
      <rect x="17" y="14" width="4" height="6" rx="1.5" />
      <path d="M12 20v1" />
    </svg>
  )
}
