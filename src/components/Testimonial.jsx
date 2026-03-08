import { useFadeUp } from './useFadeUp'
import Eyebrow from './Eyebrow'
import { h2Style } from './sectionStyles'

export default function Testimonial() {
  const ref = useFadeUp()

  return (
    <section ref={ref} style={{ padding: '96px 40px', background: '#faf9f7' }}>
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>
        <Eyebrow icon="⭐">Client results</Eyebrow>
        <h2 className="fade-up d1" style={h2Style}>What clients are <em style={{ fontStyle: 'italic', color: '#b8906a' }}>saying.</em></h2>

        <div className="fade-up d2" style={{
          background: 'white', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 24,
          padding: '52px 56px', marginTop: 52, maxWidth: 760,
          marginLeft: 'auto', marginRight: 'auto',
          position: 'relative', overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        }}>
          <div style={{ position: 'absolute', top: -20, left: 36, fontSize: 180, lineHeight: 1, color: 'rgba(200,169,126,0.10)', fontFamily: '"DM Serif Display", serif', pointerEvents: 'none', userSelect: 'none' }}>"</div>
          <div style={{ color: '#f59e0b', fontSize: 16, letterSpacing: 3, marginBottom: 18, position: 'relative' }}>★★★★★</div>
          <div style={{ fontFamily: '"DM Serif Display", serif', fontSize: 22, color: '#18181a', lineHeight: 1.5, letterSpacing: '-0.5px', marginBottom: 28, position: 'relative' }}>
            "We went from zero online presence to ranking on the first page of Google in three months. Our booking requests doubled and we finally have a site we're proud to send people to."
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13, position: 'relative' }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg, #c8a97e, #b8906a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 600, color: 'white', flexShrink: 0 }}>M</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#18181a' }}>Maria Chen</div>
              <div style={{ fontSize: 13, color: '#7a7888', marginTop: 1, fontWeight: 300 }}>Owner, Meridian Fitness Studio</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
