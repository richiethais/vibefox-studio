import { useFadeUp } from './useFadeUp'
import Eyebrow from './Eyebrow'
import { h2Style, subStyle } from './sectionStyles'
import useIsMobile from './useIsMobile'

const steps = [
  { num: '01', title: 'Discovery call', desc: 'We talk through your goals, audience, and what you need. Takes 30 minutes. No obligation.' },
  { num: '02', title: 'We build it', desc: 'First draft in 5–7 days. Two rounds of revisions included. You approve before anything goes live.' },
  { num: '03', title: 'Launch & grow', desc: 'We handle launch, hosting, and SSL. Your growth plan keeps everything running and improving each month.' },
]

export default function HowItWorks() {
  const ref = useFadeUp()
  const isMobile = useIsMobile()

  return (
    <section id="how" ref={ref} style={{ padding: isMobile ? '48px 18px' : '96px 40px', background: '#faf9f7' }}>
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>
        <Eyebrow>How it works</Eyebrow>
        <h2 className="fade-up d1" style={{ ...h2Style, fontSize: isMobile ? 'clamp(28px, 9vw, 40px)' : h2Style.fontSize, letterSpacing: isMobile ? '-1px' : h2Style.letterSpacing }}>3 simple steps to <em style={{ fontStyle: 'italic', color: '#b8906a' }}>effortless delivery.</em></h2>
        {!isMobile && <p className="fade-up d2" style={subStyle}>Clear process, no surprises, fast turnaround every time.</p>}

        {isMobile ? (
          /* Compact vertical timeline for mobile */
          <div className="fade-up d2" style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 0 }}>
            {steps.map((step, i) => (
              <div key={step.num} style={{ display: 'flex', gap: 14, position: 'relative' }}>
                {/* Timeline line + dot */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 24 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: '#c8a97e', color: 'white',
                    fontSize: 11, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>{i + 1}</div>
                  {i < steps.length - 1 && (
                    <div style={{ width: 1.5, flex: 1, background: 'rgba(200,169,126,0.25)', minHeight: 16 }} />
                  )}
                </div>
                {/* Content */}
                <div style={{ paddingBottom: i < steps.length - 1 ? 20 : 0, paddingTop: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#18181a', letterSpacing: '-0.2px' }}>{step.title}</div>
                  <div style={{ fontSize: 13, color: '#7a7888', lineHeight: 1.45, fontWeight: 300, marginTop: 3 }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginTop: 52 }}>
            {steps.map((s, i) => (
              <div
                key={s.num}
                className={`fade-up d${i + 1}`}
                style={{ background: '#f5f3f0', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16, padding: '28px 26px', transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,0,0,0.06)'; e.currentTarget.style.borderColor = 'rgba(200,169,126,0.25)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)' }}
              >
                <div style={{ fontFamily: '"DM Serif Display", serif', fontSize: 28, color: '#c8a97e', lineHeight: 1, marginBottom: 16 }}>{s.num}</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#18181a', marginBottom: 9, letterSpacing: '-0.3px' }}>{s.title}</div>
                <div style={{ fontSize: 14, color: '#7a7888', lineHeight: 1.58, fontWeight: 300 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
