import { useFadeUp } from './useFadeUp'
import { h2Style, subStyle } from './sectionStyles'
import useIsMobile from './useIsMobile'

const rows = [
  { feature: 'Project timeline', agency: '6-12 weeks', us: '1-2 weeks', usStrong: false },
  { feature: 'Pricing transparency', agency: 'Hidden fees', us: 'Flat rates', usStrong: true },
  { feature: 'Post-launch support', agency: 'Extra cost', us: 'Included', usStrong: true },
  { feature: 'SEO & content', agency: 'Separate vendor', us: 'All in one', usStrong: true },
  { feature: 'Custom web apps', agency: '$20,000+', us: 'From $4,000', usStrong: true },
  { feature: 'Who you talk to', agency: 'Account manager', us: 'Direct to builder', usStrong: true },
]

export default function Comparison() {
  const ref = useFadeUp()
  const isMobile = useIsMobile()
  const mobileThStyle = {
    ...thStyle,
    padding: isMobile ? '14px 14px' : thStyle.padding,
    fontSize: isMobile ? 12 : thStyle.fontSize,
  }
  const mobileTdStyle = {
    ...tdStyle,
    padding: isMobile ? '13px 14px' : tdStyle.padding,
    fontSize: isMobile ? 13 : tdStyle.fontSize,
  }

  return (
    <section ref={ref} style={{ background: '#18181a', padding: isMobile ? '80px 18px' : '96px 40px' }}>
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>
        <div className="fade-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 500, color: '#c8a97e', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 18 }}>
          <span style={{ width: 20, height: 20, background: 'rgba(200,169,126,0.15)', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', border: '1.5px solid #c8a97e' }} />
          </span>
          Why VibefoxStudio
        </div>
        <h2 className="fade-up d1" style={{ ...h2Style, color: 'white', fontSize: isMobile ? 'clamp(30px, 10vw, 44px)' : h2Style.fontSize, letterSpacing: isMobile ? '-1px' : h2Style.letterSpacing }}>
          Your competitors are already {isMobile ? ' ' : <br />}
          <em style={{ fontStyle: 'italic', color: '#c8a97e' }}>online. Are you?</em>
        </h2>
        <p className="fade-up d2" style={{ ...subStyle, color: 'rgba(255,255,255,0.42)', fontSize: isMobile ? 15 : subStyle.fontSize, maxWidth: isMobile ? 360 : subStyle.maxWidth, lineHeight: isMobile ? 1.58 : subStyle.lineHeight }}>
          See how working with us compares to a traditional agency.
        </p>

        <div className="fade-up d3" style={{ marginTop: isMobile ? 36 : 52, borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', overflow: isMobile ? 'auto' : 'hidden' }}>
          <div style={{ minWidth: isMobile ? 700 : 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={mobileThStyle}>What you get</div>
              <div style={mobileThStyle}>Traditional Agency</div>
              <div style={{ ...mobileThStyle, background: 'rgba(200,169,126,0.12)', color: '#c8a97e', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#c8a97e', display: 'inline-block' }} />
                VibefoxStudio
              </div>
            </div>
            {rows.map(row => (
              <div key={row.feature} style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', borderTop: '1px solid rgba(255,255,255,0.05)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{ ...mobileTdStyle, color: 'rgba(255,255,255,0.62)', fontWeight: 500 }}>{row.feature}</div>
                <div style={{ ...mobileTdStyle, color: 'rgba(255,255,255,0.28)' }}>{row.agency}</div>
                <div style={{ ...mobileTdStyle, background: 'rgba(200,169,126,0.06)', color: row.usStrong ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.37)' }}>
                  <span style={{ color: row.usStrong ? '#4ade80' : 'inherit' }}>{row.us}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

const thStyle = { padding: '17px 24px', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.3)' }
const tdStyle = { padding: '15px 24px', fontSize: 14, color: 'rgba(255,255,255,0.37)', fontWeight: 300, display: 'flex', alignItems: 'center', gap: 8 }
