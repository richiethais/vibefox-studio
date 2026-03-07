import { useEffect, useState } from 'react'

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      style={{
        position: 'fixed',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 200,
        width: 'min(900px, calc(100% - 48px))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(250,249,247,0.82)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.9)',
        borderRadius: 100,
        padding: '11px 12px 11px 24px',
        boxShadow: scrolled
          ? '0 8px 32px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.05)'
          : '0 4px 24px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)',
        transition: 'box-shadow 0.3s',
      }}
    >
      <a href="#" style={{ fontFamily: '"DM Serif Display", serif', fontSize: 19, color: '#18181a', textDecoration: 'none', letterSpacing: '-0.3px' }}>
        Vibefox <span style={{ color: '#b8906a' }}>Studio</span>
      </a>

      <ul style={{ display: 'flex', alignItems: 'center', gap: 2, listStyle: 'none', margin: 0, padding: 0 }}>
        {['Services', 'Work', 'Pricing', 'FAQ'].map(link => (
          <li key={link}>
            <a
              href={`#${link.toLowerCase()}`}
              style={{ textDecoration: 'none', color: '#7a7888', fontSize: 14, fontWeight: 400, padding: '7px 14px', borderRadius: 100, display: 'block', transition: 'all 0.18s' }}
              onMouseEnter={e => { e.target.style.color = '#18181a'; e.target.style.background = 'rgba(0,0,0,0.04)' }}
              onMouseLeave={e => { e.target.style.color = '#7a7888'; e.target.style.background = 'transparent' }}
            >
              {link}
            </a>
          </li>
        ))}
        <li>
          <a
            href="mailto:richie@vibefoxstudio.com"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#18181a', color: '#fff',
              padding: '10px 20px', borderRadius: 100,
              fontWeight: 500, fontSize: 13.5,
              textDecoration: 'none', whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#2a2830'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#18181a'; e.currentTarget.style.transform = 'none' }}
          >
            Get in touch →
          </a>
        </li>
      </ul>
    </nav>
  )
}
