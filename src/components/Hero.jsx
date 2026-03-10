import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import useIsMobile from './useIsMobile'

const ROTATING_WORDS = ['converts.', 'performs.', 'works.', 'functions.', 'delivers.']

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
  dot: { width: 6, height: 6, borderRadius: '50%', background: '#b8906a', opacity: 0.8 },
}

export default function Hero() {
  const isMobile = useIsMobile()
  const [wordIndex, setWordIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % ROTATING_WORDS.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  return (
    <section style={{ ...s.section, padding: isMobile ? '128px 18px 64px' : s.section.padding }}>
      <div className="anim-rise-1" style={{ ...s.pill, fontSize: isMobile ? 12 : s.pill.fontSize, marginBottom: isMobile ? 24 : s.pill.marginBottom, padding: isMobile ? '6px 14px 6px 8px' : s.pill.padding }}>
        <span style={s.chip}>2026</span>
        Jacksonville, FL growth partner
      </div>

      <h1 className="anim-rise-2" style={{ ...s.h1, fontSize: isMobile ? 'clamp(36px, 12vw, 52px)' : s.h1.fontSize, letterSpacing: isMobile ? '-1.3px' : s.h1.letterSpacing }}>
        Your business deserves a site that
      </h1>

      <div className="anim-rise-2" style={{ position: 'relative', height: isMobile ? 50 : 80, overflow: 'hidden', marginTop: isMobile ? 4 : 8 }}>
        {ROTATING_WORDS.map((word, index) => (
          <motion.span
            key={word}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              fontFamily: '"DM Serif Display", serif',
              fontSize: isMobile ? 'clamp(36px, 12vw, 52px)' : 'clamp(48px, 8vw, 96px)',
              fontStyle: 'italic',
              color: '#b8906a',
              letterSpacing: isMobile ? '-1.3px' : '-2.5px',
              textAlign: 'center',
            }}
            initial={{ y: '100%', opacity: 0 }}
            animate={
              wordIndex === index
                ? { y: 0, opacity: 1 }
                : wordIndex > index || (wordIndex === 0 && index === ROTATING_WORDS.length - 1)
                  ? { y: '-100%', opacity: 0 }
                  : { y: '100%', opacity: 0 }
            }
            transition={{
              type: 'spring',
              stiffness: 80,
              damping: 20,
            }}
          >
            {word}
          </motion.span>
        ))}
      </div>

      <p className="anim-rise-3" style={{ ...s.sub, fontSize: isMobile ? 15 : s.sub.fontSize, margin: isMobile ? '18px auto 0' : s.sub.margin, maxWidth: isMobile ? 340 : s.sub.maxWidth, lineHeight: isMobile ? 1.56 : s.sub.lineHeight }}>
        Jacksonville web design and SEO services built for measurable growth. Vibefox Studio delivers fast, high-converting websites and SEO systems for local businesses ready to scale.
      </p>

      <div className="anim-rise-4" style={{ ...s.btns, marginTop: isMobile ? 30 : s.btns.marginTop, gap: isMobile ? 10 : s.btns.gap, flexDirection: isMobile ? 'column' : s.btns.flexDirection, width: isMobile ? '100%' : undefined, alignItems: isMobile ? 'center' : undefined }}>
        <a
          href="#contact"
          style={{ ...s.btnDark, width: isMobile ? 'min(320px, 100%)' : 'auto', justifyContent: 'center' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#2a2830'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#18181a'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
        >
          Start a project <span style={s.btnArr}>→</span>
        </a>
        <a
          href="#pricing"
          style={{ ...s.btnGhost, width: isMobile ? 'min(320px, 100%)' : 'auto', justifyContent: 'center' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#edeae5' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(250,249,247,0.8)' }}
        >
          View pricing
        </a>
      </div>

      <div className="anim-rise-5" style={{ ...s.trust, gap: isMobile ? 16 : s.trust.gap, marginTop: isMobile ? 30 : s.trust.marginTop, fontSize: isMobile ? 12 : s.trust.fontSize }}>
        {['Fast turnaround', 'Jacksonville local SEO', 'Retainers available'].map(t => (
          <div key={t} style={s.trustItem}>
            <span style={s.dot} /> {t}
          </div>
        ))}
      </div>

      <div className="anim-rise-6" style={{ marginTop: isMobile ? 48 : 72, width: '100%', maxWidth: 820 }}>
        <DashboardMockup isMobile={isMobile} />
      </div>
    </section>
  )
}

function DashboardMockup({ isMobile }) {
  return (
    <div style={{
      background: 'rgba(250,249,247,0.75)',
      border: '1px solid rgba(255,255,255,0.92)',
      borderRadius: isMobile ? 18 : 22, overflow: 'hidden',
      boxShadow: '0 2px 4px rgba(0,0,0,0.04), 0 8px 28px rgba(0,0,0,0.07), 0 28px 64px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.85)',
      backdropFilter: 'blur(16px)',
    }}>
      <div style={{ background: 'rgba(237,234,229,0.9)', padding: isMobile ? '10px 12px' : '12px 18px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        {['#ff5f57','#febc2e','#28c840'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
        <div style={{ flex: 1, textAlign: 'center', background: 'rgba(250,249,247,0.8)', borderRadius: 100, padding: '5px 16px', fontSize: isMobile ? 11 : 12, color: '#7a7888', maxWidth: isMobile ? 180 : 240, margin: '0 auto', border: '1px solid rgba(0,0,0,0.08)' }}>
          vibefoxstudio.com/dashboard
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '185px 1fr', minHeight: 250 }}>
        <div style={{ background: '#18181a', padding: '18px 12px', display: isMobile ? 'none' : 'flex', flexDirection: 'column', gap: 4 }}>
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
        <div style={{ padding: isMobile ? 12 : 18, background: '#f8f6f2', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 9 }}>
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
            <div key={item.name} style={{ background: 'white', borderRadius: 10, padding: isMobile ? '11px 12px' : '12px 14px', border: '1px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: 10, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: item.bg }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#18181a' }}>{item.name}</div>
                <div style={{ fontSize: 11, color: '#7a7888', marginTop: 1 }}>{item.desc}</div>
              </div>
              <div style={{ fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 100, whiteSpace: 'nowrap', marginLeft: isMobile ? 0 : 'auto', marginTop: isMobile ? 2 : 0, background: item.statusColor, color: item.statusText }}>{item.status}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
