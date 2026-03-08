import { useFadeUp } from './useFadeUp'
import BrandLogo from './BrandLogo'

export function CTA() {
  const ref = useFadeUp()
  return (
    <div ref={ref} style={{ padding: '72px 40px' }}>
      <div className="fade-up" style={{
        maxWidth: 1040, margin: '0 auto',
        background: '#18181a', borderRadius: 28,
        padding: '80px 60px', textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)', width: 520, height: 260, background: 'radial-gradient(ellipse, rgba(200,169,126,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <h2 style={{ fontFamily: '"DM Serif Display", serif', fontSize: 'clamp(36px, 5vw, 56px)', lineHeight: 1.04, color: 'white', letterSpacing: '-1.5px', margin: '0 0 18px', position: 'relative' }}>
          Ready to build something <br />
          <em style={{ fontStyle: 'italic', color: '#c8a97e' }}>that works?</em>
        </h2>
        <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.42)', maxWidth: 400, margin: '0 auto', fontWeight: 300, lineHeight: 1.68, position: 'relative' }}>
          No pressure, no sales pitch, just a real conversation with a Jacksonville SEO and digital marketing team.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 40, flexWrap: 'wrap', position: 'relative' }}>
          <a
            href="/#contact"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#faf9f7', color: '#18181a', padding: '14px 28px', borderRadius: 100, fontSize: 15, fontWeight: 500, textDecoration: 'none', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#faf9f7'; e.currentTarget.style.transform = 'none' }}
          >
            Start a project <span style={{ width: 22, height: 22, background: 'rgba(0,0,0,0.08)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>→</span>
          </a>
          <a
            href="/pricing"
            style={{ color: 'rgba(255,255,255,0.42)', padding: '14px 22px', borderRadius: 100, fontSize: 15, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.2s', fontWeight: 400 }}
            onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.42)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
          >
            View pricing
          </a>
        </div>
      </div>
    </div>
  )
}

export function Footer() {
  return (
    <footer style={{ padding: '56px 40px 36px', borderTop: '1px solid rgba(0,0,0,0.08)', background: '#faf9f7' }}>
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr', gap: 40, marginBottom: 44 }}>
          <div>
            <BrandLogo href="/" size="nav" />
            <p style={{ fontSize: 13, color: '#7a7888', marginTop: 10, lineHeight: 1.6, maxWidth: 200, fontWeight: 300 }}>
              VibefoxStudio is a Jacksonville digital marketing agency for businesses that want measurable growth.
            </p>
          </div>

          {[
            { heading: 'Services', links: [['Landing Pages','/services'],['Business Websites','/services'],['Custom Web Apps','/services'],['SEO & Content','/services']] },
            { heading: 'Plans', links: [['Starter — $200/mo','/pricing'],['Growth — $500/mo','/pricing'],['Pro — $900/mo','/pricing'],['Blog','/blog']] },
            { heading: 'Contact', links: [['richie@vibefoxstudio.com','mailto:richie@vibefoxstudio.com'],['Jacksonville, FL','/services'],['FAQ','/faq']] },
          ].map(col => (
            <div key={col.heading}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#18181a', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 13 }}>{col.heading}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <a href={href} style={{ fontSize: 13, color: '#7a7888', textDecoration: 'none', fontWeight: 300, transition: 'color 0.18s' }}
                      onMouseEnter={e => e.target.style.color = '#18181a'}
                      onMouseLeave={e => e.target.style.color = '#7a7888'}
                    >{label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 24, borderTop: '1px solid rgba(0,0,0,0.08)', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#7a7888', fontWeight: 300 }}>© 2026 VibefoxStudio. All rights reserved.</span>
          <a href="mailto:richie@vibefoxstudio.com" style={{ fontSize: 13, color: '#7a7888', textDecoration: 'none', transition: 'color 0.18s' }}
            onMouseEnter={e => e.target.style.color = '#18181a'}
            onMouseLeave={e => e.target.style.color = '#7a7888'}
          >richie@vibefoxstudio.com</a>
        </div>
      </div>
    </footer>
  )
}
