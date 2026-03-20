import { useFadeUp } from './useFadeUp'
import BrandLogo from './BrandLogo'
import useIsMobile from './useIsMobile'

export function CTA() {
  const ref = useFadeUp()
  const isMobile = useIsMobile()
  return (
    <div ref={ref} style={{ padding: isMobile ? '32px 16px' : '72px 40px' }}>
      <div className="fade-up" style={{
        maxWidth: 1040, margin: '0 auto',
        background: '#18181a', borderRadius: isMobile ? 18 : 28,
        padding: isMobile ? '32px 16px' : '80px 60px', textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)', width: isMobile ? 320 : 520, height: isMobile ? 220 : 260, background: 'radial-gradient(ellipse, rgba(200,169,126,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <h2 style={{ fontFamily: '"DM Serif Display", serif', fontSize: isMobile ? 'clamp(22px, 6.5vw, 30px)' : 'clamp(36px, 5vw, 56px)', lineHeight: 1.08, color: 'white', letterSpacing: isMobile ? '-0.5px' : '-1.5px', margin: '0 0 14px', position: 'relative' }}>
          Ready to build something {isMobile ? ' ' : <br />}
          <em style={{ fontStyle: 'italic', color: '#c8a97e' }}>that works?</em>
        </h2>
        <p style={{ fontSize: isMobile ? 13 : 17, color: 'rgba(255,255,255,0.42)', maxWidth: isMobile ? '100%' : 400, margin: '0 auto', fontWeight: 300, lineHeight: 1.55, position: 'relative', padding: isMobile ? '0 8px' : 0 }}>
          No pressure, no sales pitch, just a real conversation with a Jacksonville SEO and digital marketing team.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: isMobile ? 24 : 40, flexWrap: 'wrap', position: 'relative', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', padding: isMobile ? '0 8px' : 0 }}>
          <a
            href="/contact"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'center', background: '#faf9f7', color: '#18181a', padding: isMobile ? '12px 20px' : '14px 28px', borderRadius: 100, fontSize: isMobile ? 14 : 15, fontWeight: 500, textDecoration: 'none', transition: 'all 0.2s', width: isMobile ? '100%' : 'auto', boxSizing: 'border-box' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#faf9f7'; e.currentTarget.style.transform = 'none' }}
          >
            Start a project <span style={{ width: 20, height: 20, background: 'rgba(0,0,0,0.08)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>→</span>
          </a>
          <a
            href="/pricing"
            style={{ color: 'rgba(255,255,255,0.42)', padding: isMobile ? '12px 16px' : '14px 22px', borderRadius: 100, fontSize: isMobile ? 14 : 15, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.2s', fontWeight: 400, textAlign: 'center', width: isMobile ? '100%' : 'auto', boxSizing: 'border-box' }}
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
  const isMobile = useIsMobile()

  return (
    <footer style={{ padding: isMobile ? '36px 16px 24px' : '56px 40px 36px', borderTop: '1px solid rgba(0,0,0,0.08)', background: '#faf9f7' }}>
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : '1.6fr 1fr 1fr 1fr', gap: isMobile ? '24px 16px' : 40, marginBottom: isMobile ? 24 : 44 }}>
          <div style={{ gridColumn: isMobile ? '1 / -1' : 'auto' }}>
            <BrandLogo href="/" size={isMobile ? 'sm' : 'nav'} />
            <p style={{ fontSize: isMobile ? 12 : 13, color: '#7a7888', marginTop: 8, lineHeight: 1.5, maxWidth: isMobile ? '100%' : 200, fontWeight: 300 }}>
              Jacksonville digital marketing agency for businesses that want measurable growth.
            </p>
          </div>

          {[
            { heading: 'Services', links: [['Landing Pages','/services'],['Websites','/services'],['Web Apps','/services'],['SEO','/services']] },
            { heading: 'Plans', links: [['Starter','/pricing'],['Growth','/pricing'],['Pro','/pricing'],['Blogs','/blogs']] },
            { heading: 'Contact', links: [['Email Us','mailto:richie@vibefoxstudio.com'],['Jacksonville, FL','/services'],['FAQ','/faq']] },
          ].map(col => (
            <div key={col.heading}>
              <div style={{ fontSize: isMobile ? 10 : 11.5, fontWeight: 700, color: '#18181a', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: isMobile ? 10 : 13 }}>{col.heading}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: isMobile ? 6 : 9 }}>
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <a href={href} style={{ fontSize: isMobile ? 12 : 13, color: '#7a7888', textDecoration: 'none', fontWeight: 300, transition: 'color 0.18s' }}
                      onMouseEnter={e => e.target.style.color = '#18181a'}
                      onMouseLeave={e => e.target.style.color = '#7a7888'}
                    >{label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'center' : 'space-between', paddingTop: isMobile ? 16 : 24, borderTop: '1px solid rgba(0,0,0,0.08)', flexWrap: 'wrap', gap: 8, flexDirection: isMobile ? 'column' : 'row' }}>
          <span style={{ fontSize: isMobile ? 11 : 13, color: '#7a7888', fontWeight: 300 }}>© 2026 VibefoxStudio</span>
          <a href="mailto:richie@vibefoxstudio.com" style={{ fontSize: isMobile ? 11 : 13, color: '#7a7888', textDecoration: 'none', transition: 'color 0.18s' }}
            onMouseEnter={e => e.target.style.color = '#18181a'}
            onMouseLeave={e => e.target.style.color = '#7a7888'}
          >richie@vibefoxstudio.com</a>
        </div>
      </div>
    </footer>
  )
}
