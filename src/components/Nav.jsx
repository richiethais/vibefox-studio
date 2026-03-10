import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
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
  const location = useLocation()

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
        <Link to="/" style={{ textDecoration: 'none', position: 'relative', display: 'inline-flex' }}>
          <BrandLogo size={isMobile ? 'sm' : 'nav'} />
          {location.pathname === '/' && (
            <motion.div
              layoutId="lamp"
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 100,
                background: 'rgba(184,144,106,0.08)',
                zIndex: -1,
              }}
              initial={false}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div style={{
                position: 'absolute',
                bottom: -8,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 32,
                height: 4,
                background: 'rgb(184,144,106)',
                borderRadius: '0 0 4px 4px',
              }}>
                <div style={{
                  position: 'absolute',
                  width: 48,
                  height: 24,
                  background: 'rgba(184,144,106,0.2)',
                  borderRadius: '50%',
                  filter: 'blur(8px)',
                  bottom: -8,
                  left: -8,
                }} />
                <div style={{
                  position: 'absolute',
                  width: 32,
                  height: 24,
                  background: 'rgba(184,144,106,0.2)',
                  borderRadius: '50%',
                  filter: 'blur(8px)',
                  bottom: -4,
                }} />
                <div style={{
                  position: 'absolute',
                  width: 16,
                  height: 16,
                  background: 'rgba(184,144,106,0.2)',
                  borderRadius: '50%',
                  filter: 'blur(4px)',
                  bottom: 0,
                  left: 8,
                }} />
              </div>
            </motion.div>
          )}
        </Link>

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
          <ul style={{ display: 'flex', alignItems: 'center', gap: 2, listStyle: 'none', margin: 0, padding: 0 }}>
            {links.map(([label, to]) => {
              const isLampActive = location.pathname === to
              return (
                <li key={label}>
                  <NavLink
                    to={to}
                    style={({ isActive }) => ({
                      textDecoration: 'none',
                      color: isActive ? '#18181a' : '#7a7888',
                      fontSize: 14,
                      fontWeight: 400,
                      padding: '7px 14px',
                      borderRadius: 100,
                      display: 'block',
                      position: 'relative',
                      transition: 'color 0.18s',
                    })}
                    onMouseEnter={e => { e.currentTarget.style.color = '#18181a' }}
                    onMouseLeave={e => {
                      if (e.currentTarget.getAttribute('aria-current') !== 'page') {
                        e.currentTarget.style.color = '#7a7888'
                      }
                    }}
                  >
                    {label}
                    {isLampActive && (
                      <motion.div
                        layoutId="lamp"
                        style={{
                          position: 'absolute',
                          inset: 0,
                          borderRadius: 100,
                          background: 'rgba(184,144,106,0.08)',
                          zIndex: -1,
                        }}
                        initial={false}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      >
                        <div style={{
                          position: 'absolute',
                          top: -8,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 32,
                          height: 4,
                          background: 'rgb(184,144,106)',
                          borderRadius: '4px 4px 0 0',
                        }}>
                          <div style={{
                            position: 'absolute',
                            width: 48,
                            height: 24,
                            background: 'rgba(184,144,106,0.2)',
                            borderRadius: '50%',
                            filter: 'blur(8px)',
                            top: -8,
                            left: -8,
                          }} />
                          <div style={{
                            position: 'absolute',
                            width: 32,
                            height: 24,
                            background: 'rgba(184,144,106,0.2)',
                            borderRadius: '50%',
                            filter: 'blur(8px)',
                            top: -4,
                          }} />
                          <div style={{
                            position: 'absolute',
                            width: 16,
                            height: 16,
                            background: 'rgba(184,144,106,0.2)',
                            borderRadius: '50%',
                            filter: 'blur(4px)',
                            top: 0,
                            left: 8,
                          }} />
                        </div>
                      </motion.div>
                    )}
                  </NavLink>
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
