import { useFadeUp } from './useFadeUp'
import Eyebrow from './Eyebrow'
import { h2Style, subStyle } from './sectionStyles'

const rows = [
  ['Project timeline', '6–12 weeks', '1–2 weeks'],
  ['Pricing transparency', '✗ Hidden fees', '✓ Flat rates'],
  ['Post-launch support', '✗ Extra cost', '✓ Included'],
  ['SEO & content', '✗ Separate vendor', '✓ All in one'],
  ['Custom web apps', '$20,000+', '✓ From $4,000'],
  ['Who you talk to', 'Account manager', '✓ Direct to builder'],
]

export default function Comparison() {
  const ref = useFadeUp()

  return (
    <section ref={ref} style={{ background: '#18181a', padding: '96px 40px' }}>
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>
        <div className="fade-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 500, color: '#c8a97e', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 18 }}>
          <span style={{ width: 20, height: 20, background: 'rgba(200,169,126,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>🏆</span>
          Why VibefoxStudio
        </div>
        <h2 className="fade-up d1" style={{ ...h2Style, color: 'white' }}>
          Your competitors are already <br />
          <em style={{ fontStyle: 'italic', color: '#c8a97e' }}>online. Are you?</em>
        </h2>
        <p className="fade-up d2" style={{ ...subStyle, color: 'rgba(255,255,255,0.42)' }}>
          See how working with us compares to a traditional agency.
        </p>

        <div className="fade-up d3" style={{ marginTop: 52, borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={thStyle}>What you get</div>
            <div style={thStyle}>Traditional Agency</div>
            <div style={{ ...thStyle, background: 'rgba(200,169,126,0.12)', color: '#c8a97e', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#c8a97e', display: 'inline-block' }} />
              VibefoxStudio
            </div>
          </div>
          {rows.map(([feat, agency, us]) => (
            <div key={feat} style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', borderTop: '1px solid rgba(255,255,255,0.05)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ ...tdStyle, color: 'rgba(255,255,255,0.62)', fontWeight: 500 }}>{feat}</div>
              <div style={{ ...tdStyle, color: agency.startsWith('✗') ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.37)' }}>{agency}</div>
              <div style={{ ...tdStyle, background: 'rgba(200,169,126,0.06)', color: us.startsWith('✓') ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.37)' }}>
                <span style={{ color: us.startsWith('✓') ? '#4ade80' : 'inherit' }}>{us}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const thStyle = { padding: '17px 24px', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.3)' }
const tdStyle = { padding: '15px 24px', fontSize: 14, color: 'rgba(255,255,255,0.37)', fontWeight: 300, display: 'flex', alignItems: 'center', gap: 8 }
