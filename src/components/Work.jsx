import { useFadeUp } from './useFadeUp'
import { Eyebrow, h2Style, subStyle } from './Services'

const projects = [
  { tag: 'Web App', title: 'Meridian Fitness Studio', desc: 'Class booking, membership management, and trainer dashboard with real-time availability.', emoji: '🗓', label: 'Booking System', sub: 'Meridian Fitness', bg: 'linear-gradient(135deg, #f0ebff 0%, #e2d8f8 100%)' },
  { tag: 'Website', title: 'Cedar & Oak Realty', desc: 'Multi-page site with property search, contact forms, and monthly SEO content.', emoji: '🏡', label: 'Marketing Site', sub: 'Cedar & Oak Realty', bg: 'linear-gradient(135deg, #ebf2ff 0%, #d8e8ff 100%)' },
  { tag: 'Custom App', title: 'Bloom & Co Spa', desc: 'Intake forms, appointment history, file uploads, and a staff-facing admin dashboard.', emoji: '💆', label: 'Client Portal', sub: 'Bloom & Co Spa', bg: 'linear-gradient(135deg, #fff5eb 0%, #fae3cc 100%)' },
]

export default function Work() {
  const ref = useFadeUp()

  return (
    <section id="work" ref={ref} style={{ padding: '96px 40px' }}>
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>
        <Eyebrow icon="✦">Our work</Eyebrow>
        <h2 className="fade-up d1" style={h2Style}>Recent <em style={{ fontStyle: 'italic', color: '#b8906a' }}>projects.</em></h2>
        <p className="fade-up d2" style={subStyle}>A sample of what we've built — from landing pages to full custom apps.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginTop: 52 }}>
          {projects.map((p, i) => (
            <div
              key={p.title}
              className={`fade-up d${i + 1}`}
              style={{ background: '#faf9f7', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16, overflow: 'hidden', transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = 'rgba(200,169,126,0.25)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)' }}
            >
              <div style={{ background: p.bg, aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: 'white', borderRadius: 11, padding: '12px 16px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 16px rgba(0,0,0,0.09)', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#18181a', lineHeight: 1.4 }}>
                  {p.emoji} {p.label}
                  <div style={{ fontSize: 11, color: '#7a7888', fontWeight: 400, marginTop: 2 }}>{p.sub}</div>
                </div>
              </div>
              <div style={{ padding: '18px 20px' }}>
                <div style={{ display: 'inline-block', background: 'rgba(200,169,126,0.15)', color: '#b8906a', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 100, marginBottom: 8 }}>{p.tag}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#18181a', letterSpacing: '-0.3px' }}>{p.title}</div>
                <div style={{ fontSize: 13, color: '#7a7888', marginTop: 5, lineHeight: 1.5, fontWeight: 300 }}>{p.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
