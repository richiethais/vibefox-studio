import { useFadeUp } from './useFadeUp'
import Eyebrow from './Eyebrow'
import { h2Style } from './sectionStyles'
import useIsMobile from './useIsMobile'

export default function Testimonial() {
  const ref = useFadeUp()
  const isMobile = useIsMobile()

  return (
    <section ref={ref} style={{ padding: isMobile ? '64px 24px' : '96px 40px', background: '#faf9f7' }}>
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>
        <Eyebrow>Client results</Eyebrow>
        <h2 className="fade-up d1" style={{ ...h2Style, fontSize: isMobile ? 'clamp(24px, 7.5vw, 34px)' : h2Style.fontSize, letterSpacing: isMobile ? '-1px' : h2Style.letterSpacing }}>What clients are <em style={{ fontStyle: 'italic', color: '#b8906a' }}>saying.</em></h2>

        <div className="fade-up d2" style={{
          background: 'white', border: '1px solid rgba(0,0,0,0.08)', borderRadius: isMobile ? 18 : 24,
          padding: isMobile ? '24px 18px' : '52px 56px', marginTop: isMobile ? 28 : 52, maxWidth: 760,
          marginLeft: 'auto', marginRight: 'auto',
          position: 'relative', overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        }}>
          <div style={{ position: 'absolute', top: -20, left: isMobile ? 8 : 36, fontSize: isMobile ? 90 : 180, lineHeight: 1, color: 'rgba(200,169,126,0.10)', fontFamily: '"DM Serif Display", serif', pointerEvents: 'none', userSelect: 'none' }}>"</div>
          <div style={{ display: 'inline-flex', gap: 5, marginBottom: 18, position: 'relative' }}>
            {Array.from({ length: 5 }, (_, idx) => (
              <span key={idx} style={{ width: 9, height: 9, borderRadius: '50%', background: '#f59e0b' }} />
            ))}
          </div>
          <div style={{ fontFamily: '"DM Serif Display", serif', fontSize: isMobile ? 18 : 22, color: '#18181a', lineHeight: 1.5, letterSpacing: '-0.3px', marginBottom: isMobile ? 20 : 28, position: 'relative' }}>
            "Vibefox Studio built us a beautiful website that really captures the feel of our restaurant. We went from having no online presence to getting new customers every week who found us through Google. The site is easier for guests to use, the menu is finally clear on mobile, and the whole process felt fast, thoughtful, and genuinely focused on getting the details right."
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13, position: 'relative' }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '2px solid rgba(200,169,126,0.3)' }}>
              <img src="/olympia-cafe-hero.webp" alt="Olympia Cafe" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#18181a' }}>Olympia Cafe</div>
              <div style={{ fontSize: 13, color: '#7a7888', marginTop: 1, fontWeight: 300 }}>
                Greek Restaurant · <a href="https://olympia-cafe.com" target="_blank" rel="noopener noreferrer" style={{ color: '#b8906a', textDecoration: 'none' }}>olympia-cafe.com</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
