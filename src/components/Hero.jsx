const s = {
  section: {
    minHeight: '100svh',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    textAlign: 'center',
    padding: '160px 40px 80px',
    background: `
      radial-gradient(55% 45% at 50% 0%, rgba(200,169,126,0.18) 0%, transparent 100%),
      radial-gradient(35% 40% at 15% 70%, rgba(180,150,110,0.10) 0%, transparent 70%),
      radial-gradient(30% 35% at 85% 60%, rgba(120,110,140,0.07) 0%, transparent 70%),
      #f5f3f0
    `,
    overflow: 'hidden',
  },
  pill: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    background: 'rgba(250,249,247,0.85)', border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: 100, padding: '6px 16px 6px 8px',
    fontSize: 13, color: '#7a7888', marginBottom: 36,
  },
  chip: {
    background: '#18181a', color: 'white',
    fontSize: 11, fontWeight: 600, padding: '3px 11px', borderRadius: 100,
  },
  h1: {
    fontFamily: '"DM Serif Display", serif',
    fontSize: 'clamp(48px, 8vw, 96px)',
    lineHeight: 1.00, color: '#18181a', letterSpacing: '-2.5px',
    maxWidth: 860, margin: '0 auto',
  },
  icon: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: '0.75em', height: '0.75em',
    background: 'rgba(250,249,247,0.9)', border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: '0.16em', fontSize: '0.60em',
    verticalAlign: 'middle', margin: '0 0.05em -0.04em',
    boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
  },
  sub: {
    fontSize: 17, color: '#7a7888', maxWidth: 500,
    margin: '24px auto 0', fontWeight: 300, lineHeight: 1.68,
  },
  btns: { display: 'flex', gap: 12, marginTop: 40, justifyContent: 'center', flexWrap: 'wrap' },
  btnDark: {
    display: 'inline-flex', alignItems: 'center', gap: 10,
    background: '#18181a', color: '#fff',
    padding: '14px 28px', borderRadius: 100,
    fontSize: 15, fontWeight: 500, textDecoration: 'none',
    transition: 'all 0.2s', letterSpacing: '-0.2px',
  },
  btnArr: {
    width: 22, height: 22, background: 'rgba(255,255,255,0.15)',
    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12,
  },
  btnGhost: {
    display: 'inline-flex', alignItems: 'center',
    background: 'rgba(250,249,247,0.8)', color: '#3a3840',
    padding: '14px 22px', borderRadius: 100,
    fontSize: 15, fontWeight: 400, textDecoration: 'none',
    border: '1px solid rgba(0,0,0,0.08)', transition: 'all 0.2s',
  },
  trust: {
    display: 'flex', alignItems: 'center', gap: 28, marginTop: 44,
    fontSize: 13, color: '#7a7888', flexWrap: 'wrap', justifyContent: 'center',
  },
  trustItem: { display: 'flex', alignItems: 'center', gap: 7 },
  dot: { color: '#b8906a', fontSize: 11 },
}

export default function Hero() {
  return (
    <section style={s.section}>
      <div className="anim-rise-1" style={s.pill}>
        <span style={s.chip}>2026</span>
        Jacksonville, FL growth partner
      </div>

      <h1 className="anim-rise-2" style={s.h1}>
        Your business{' '}
        <span className="anim-wiggle" style={s.icon}>🌐</span>
        {' '}deserves a site that{' '}
        <em style={{ fontStyle: 'italic', color: '#b8906a' }}>actually works.</em>
      </h1>

      <p className="anim-rise-3" style={s.sub}>
        VibefoxStudio builds fast websites, SEO systems, and custom apps for Jacksonville businesses that want measurable growth.
      </p>

      <div className="anim-rise-4" style={s.btns}>
        <a
          href="#contact"
          style={s.btnDark}
          onMouseEnter={e => { e.currentTarget.style.background = '#2a2830'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#18181a'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
        >
          Start a project <span style={s.btnArr}>→</span>
        </a>
        <a
          href="#pricing"
          style={s.btnGhost}
          onMouseEnter={e => { e.currentTarget.style.background = '#edeae5' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(250,249,247,0.8)' }}
        >
          View pricing
        </a>
      </div>

      <div className="anim-rise-5" style={s.trust}>
        {['Fast turnaround', 'Jacksonville local SEO', 'Retainers available'].map(t => (
          <div key={t} style={s.trustItem}>
            <span style={s.dot}>✦</span> {t}
          </div>
        ))}
      </div>

      <div className="anim-rise-6" style={{ marginTop: 72, width: '100%', maxWidth: 820 }}>
        <DashboardMockup />
      </div>
    </section>
  )
}

function DashboardMockup() {
  return (
    <div style={{
      background: 'rgba(250,249,247,0.75)',
      border: '1px solid rgba(255,255,255,0.92)',
      borderRadius: 22, overflow: 'hidden',
      boxShadow: '0 2px 4px rgba(0,0,0,0.04), 0 8px 28px rgba(0,0,0,0.07), 0 28px 64px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.85)',
      backdropFilter: 'blur(16px)',
    }}>
      <div style={{ background: 'rgba(237,234,229,0.9)', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        {['#ff5f57','#febc2e','#28c840'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
        <div style={{ flex: 1, textAlign: 'center', background: 'rgba(250,249,247,0.8)', borderRadius: 100, padding: '5px 16px', fontSize: 12, color: '#7a7888', maxWidth: 240, margin: '0 auto', border: '1px solid rgba(0,0,0,0.08)' }}>
          vibefoxstudio.com/dashboard
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '185px 1fr', minHeight: 250 }}>
        <div style={{ background: '#18181a', padding: '18px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontFamily: '"DM Serif Display", serif', fontSize: 13, color: 'rgba(255,255,255,0.88)', padding: '0 8px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 6 }}>
            Vibefox Studio
          </div>
          {[['Overview', true], ['Projects', false], ['Clients', false], ['Analytics', false]].map(([label, on]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, fontSize: 12, background: on ? 'rgba(255,255,255,0.08)' : 'transparent', color: on ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.38)' }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
              {label}
            </div>
          ))}
        </div>
        <div style={{ padding: 18, background: '#f8f6f2', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 9 }}>
            {[['Load Time','0.8s','↑ 3× faster'],['SEO Score','96','↑ Top 5%'],['Uptime','99.9%','↑ All time']].map(([l,v,s]) => (
              <div key={l} style={{ background: 'white', borderRadius: 10, padding: 13, border: '1px solid rgba(0,0,0,0.08)' }}>
                <div style={{ fontSize: 10, color: '#7a7888', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{l}</div>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#18181a', marginTop: 3, letterSpacing: '-0.6px' }}>{v}</div>
                <div style={{ fontSize: 10, color: '#16a34a', marginTop: 1 }}>{s}</div>
              </div>
            ))}
          </div>
          {[
            { name: 'New project inquiry', desc: 'Local restaurant — website + booking', status: 'Active', statusColor: '#dcfce7', statusText: '#16a34a', bg: 'linear-gradient(135deg,#c8a97e,#b8906a)' },
            { name: 'Retainer renewal', desc: 'Growth plan — month 4 of 12', status: 'Renewed', statusColor: '#fef3c7', statusText: '#d97706', bg: 'linear-gradient(135deg,#8b68d4,#6644b0)' },
          ].map(item => (
            <div key={item.name} style={{ background: 'white', borderRadius: 10, padding: '12px 14px', border: '1px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: item.bg }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#18181a' }}>{item.name}</div>
                <div style={{ fontSize: 11, color: '#7a7888', marginTop: 1 }}>{item.desc}</div>
              </div>
              <div style={{ fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 100, whiteSpace: 'nowrap', marginLeft: 'auto', background: item.statusColor, color: item.statusText }}>{item.status}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
