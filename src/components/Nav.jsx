import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import BrandLogo from './BrandLogo'

const links = [
  ['Services', '/services'],
  ['Work', '/work'],
  ['Pricing', '/pricing'],
  ['FAQ', '/faq'],
  ['Blogs', '/blogs'],
]

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [hoveredTab, setHoveredTab] = useState(null)
  const location = useLocation()

  // Determine the active tab based on current route
  const activeTab = links.find(([, to]) => location.pathname === to)?.[0] || null

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 920
      setIsMobile(mobile)
      if (!mobile) setMenuOpen(false)
    }

    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <>
      <nav
        style={{
          position: 'fixed',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 220,
          width: isMobile ? 'calc(100% - 24px)' : 'min(1000px, calc(100% - 48px))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(250,249,247,0.82)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.9)',
          borderRadius: 100,
          padding: isMobile ? '10px 12px 10px 16px' : '11px 12px 11px 24px',
          boxShadow: scrolled
            ? '0 8px 32px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.05)'
            : '0 4px 24px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)',
          transition: 'box-shadow 0.3s',
        }}
      >
        <BrandLogo href="/" size={isMobile ? 'sm' : 'nav'} />

        {isMobile ? (
          <button
            aria-label="Toggle menu"
            onClick={() => setMenuOpen(v => !v)}
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              border: '1px solid rgba(0,0,0,0.1)',
              background: 'white',
              color: '#18181a',
              fontSize: 18,
              cursor: 'pointer',
            }}
          >
            {menuOpen ? '×' : '☰'}
          </button>
        ) : (
          <ul
            style={{ display: 'flex', alignItems: 'center', gap: 2, listStyle: 'none', margin: 0, padding: 0 }}
            onMouseLeave={() => setHoveredTab(null)}
          >
            {links.map(([label, to]) => {
              const isActive = location.pathname === to
              const isHovered = hoveredTab === label
              const showHighlight = isHovered || (isActive && hoveredTab === null)

              return (
                <li key={label} style={{ position: 'relative' }}>
                  <NavLink
                    to={to}
                    onMouseEnter={() => setHoveredTab(label)}
                    style={{
                      textDecoration: 'none',
                      color: isActive || isHovered ? '#18181a' : '#7a7888',
                      fontSize: 14,
                      fontWeight: 400,
                      padding: '7px 14px',
                      borderRadius: 100,
                      display: 'block',
                      position: 'relative',
                      zIndex: 10,
                      transition: 'color 0.18s',
                    }}
                  >
                    {label}
                  </NavLink>
                  {showHighlight && (
                    <motion.div
                      layoutId="nav-tubelight"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.06)',
                        borderRadius: 100,
                        zIndex: 0,
                      }}
                      initial={false}
                      transition={{
                        type: 'spring',
                        stiffness: 350,
                        damping: 30,
                      }}
                    >
                      {/* Tubelight glow effect */}
                      <div
                        style={{
                          position: 'absolute',
                          top: -2,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 24,
                          height: 3,
                          background: '#b8906a',
                          borderRadius: '4px 4px 0 0',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: -6,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 36,
                          height: 12,
                          background: 'rgba(184,144,106,0.25)',
                          borderRadius: 20,
                          filter: 'blur(6px)',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: -4,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 20,
                          height: 8,
                          background: 'rgba(184,144,106,0.3)',
                          borderRadius: 20,
                          filter: 'blur(4px)',
                        }}
                      />
                    </motion.div>
                  )}
                </li>
              )
            })}
            <li>
              <a
                href="/#contact"
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
        )}
      </nav>

      {isMobile && menuOpen && (
        <div
          style={{
            position: 'fixed',
            top: 74,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 210,
            width: 'calc(100% - 24px)',
            background: 'rgba(250,249,247,0.98)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            border: '1px solid rgba(0,0,0,0.08)',
            borderRadius: 20,
            padding: 10,
            boxShadow: '0 18px 36px rgba(0,0,0,0.12)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {links.map(([label, to]) => (
              <NavLink
                key={label}
                to={to}
                onClick={() => setMenuOpen(false)}
                style={({ isActive }) => ({
                  textDecoration: 'none',
                  color: isActive ? '#18181a' : '#3a3840',
                  fontSize: 15,
                  fontWeight: 500,
                  padding: '11px 14px',
                  borderRadius: 12,
                  background: isActive ? 'rgba(0,0,0,0.06)' : 'transparent',
                })}
              >
                {label}
              </NavLink>
            ))}
            <a
              href="/#contact"
              onClick={() => setMenuOpen(false)}
              style={{
                marginTop: 2,
                textDecoration: 'none',
                color: 'white',
                background: '#18181a',
                borderRadius: 12,
                padding: '11px 14px',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              Get in touch →
            </a>
          </div>
        </div>
      )}
    </>
  )
}
