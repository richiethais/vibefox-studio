import { useFadeUp } from './useFadeUp'
import Eyebrow from './Eyebrow'
import { h2Style, subStyle } from './sectionStyles'
import useIsMobile from './useIsMobile'

const projects = [
  { tag: 'Web App', title: 'Fitness Booking Platform', desc: 'Class scheduling, membership tiers, trainer dashboards, and real-time availability — all in one seamless app.', iconKey: 'calendar', label: 'Booking System', sub: 'Fitness & Wellness', bg: 'linear-gradient(135deg, #f0ebff 0%, #e2d8f8 100%)' },
  { tag: 'Website', title: 'Real Estate Marketing Site', desc: 'Property listings with advanced search, virtual tours, lead capture forms, and ongoing SEO content strategy.', iconKey: 'home', label: 'Marketing Site', sub: 'Real Estate', bg: 'linear-gradient(135deg, #ebf2ff 0%, #d8e8ff 100%)' },
  { tag: 'Custom App', title: 'Spa & Salon Client Portal', desc: 'Online booking, intake forms, appointment history, file uploads, and a staff-facing admin dashboard.', iconKey: 'portal', label: 'Client Portal', sub: 'Beauty & Wellness', bg: 'linear-gradient(135deg, #fff5eb 0%, #fae3cc 100%)' },
]

export default function Work() {
  const ref = useFadeUp()
  const isMobile = useIsMobile()

  return (
    <section id="work" ref={ref} style={{ padding: isMobile ? '80px 18px' : '96px 40px' }}>
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>
        <Eyebrow>Demo Projects</Eyebrow>
        <h2 className="fade-up d1" style={{ ...h2Style, fontSize: isMobile ? 'clamp(30px, 10vw, 44px)' : h2Style.fontSize, letterSpacing: isMobile ? '-1px' : h2Style.letterSpacing }}>What we can <em style={{ fontStyle: 'italic', color: '#b8906a' }}>build.</em></h2>
        <p className="fade-up d2" style={{ ...subStyle, fontSize: isMobile ? 15 : subStyle.fontSize, maxWidth: isMobile ? 360 : subStyle.maxWidth, lineHeight: isMobile ? 1.58 : subStyle.lineHeight }}>A glimpse of what's possible — from marketing sites to full-stack custom apps.</p>

        <div className={isMobile ? 'mobile-scroll' : ''} style={isMobile ? {
          display: 'flex', gap: 14, marginTop: 36,
          overflowX: 'auto', scrollSnapType: 'x mandatory',
          paddingBottom: 8, WebkitOverflowScrolling: 'touch',
        } : {
          display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18, marginTop: 52,
        }}>
          {projects.map((project, i) => (
            <div
              key={project.title}
              className={`fade-up d${i + 1}`}
              style={{ background: '#faf9f7', border: '1px solid rgba(0,0,0,0.08)', borderRadius: isMobile ? 14 : 16, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.22,1,0.36,1)', minWidth: isMobile ? '85vw' : undefined, scrollSnapAlign: isMobile ? 'start' : undefined, flexShrink: isMobile ? 0 : undefined }}
              onMouseEnter={e => { if (!isMobile) { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = 'rgba(200,169,126,0.25)' }}}
              onMouseLeave={e => { if (!isMobile) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)' }}}
            >
              <div style={{ background: project.bg, aspectRatio: isMobile ? '16/10' : '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: 'white', borderRadius: 11, padding: isMobile ? '14px 18px' : '12px 16px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 16px rgba(0,0,0,0.09)', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#18181a', lineHeight: 1.4 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <WorkGlyph iconKey={project.iconKey} /> {project.label}
                  </div>
                  <div style={{ fontSize: 11, color: '#7a7888', fontWeight: 400, marginTop: 3 }}>{project.sub}</div>
                </div>
              </div>
              <div style={{ padding: isMobile ? '16px 18px 20px' : '18px 20px' }}>
                <div style={{ display: 'inline-block', background: 'rgba(200,169,126,0.15)', color: '#b8906a', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 100, marginBottom: 8 }}>{project.tag}</div>
                <div style={{ fontSize: isMobile ? 16 : 15, fontWeight: 600, color: '#18181a', letterSpacing: '-0.3px' }}>{project.title}</div>
                <div style={{ fontSize: isMobile ? 14 : 13, color: '#7a7888', marginTop: 6, lineHeight: 1.55, fontWeight: 300 }}>{project.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function WorkGlyph({ iconKey }) {
  const common = { width: 15, height: 15, viewBox: '0 0 24 24', fill: 'none', stroke: '#b8906a', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }

  if (iconKey === 'calendar') {
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 9h18M8 3v4M16 3v4" />
        <path d="M8 13h3M13 13h3M8 17h3" />
      </svg>
    )
  }

  if (iconKey === 'home') {
    return (
      <svg {...common}>
        <path d="M4 11l8-7 8 7" />
        <path d="M6 10.5V20h12v-9.5" />
        <path d="M10 20v-5h4v5" />
      </svg>
    )
  }

  return (
    <svg {...common}>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M8 12h8M12 8v8" />
    </svg>
  )
}
