import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { motion as Motion, AnimatePresence } from 'framer-motion'
import BrandLogo from './BrandLogo'
import { useAuth } from '../lib/useAuth'

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL

function useDashboardLink() {
  const session = useAuth()
  if (!session) return '/login'
  if (session.user?.email === ADMIN_EMAIL) return '/admin'
  return '/client'
}

const links = [
  ['Home', '/'],
  ['Work', '/work'],
  ['Pricing', '/pricing'],
  ['FAQ', '/faq'],
  ['Blogs', '/blogs'],
]

const servicesDropdown = [
  { label: 'Web Design Jacksonville', href: '/web-design-jacksonville-fl', desc: 'Fast, converting websites' },
  { label: 'SEO Services Jacksonville', href: '/seo-services-jacksonville-fl', desc: 'Local SEO & content' },
  { label: 'All Services', href: '/services', desc: 'Full service overview' },
]

function DashboardIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  )
}

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [servicesOpen, setServicesOpen] = useState(false)
  const location = useLocation()
  const dashboardLink = useDashboardLink()

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

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  return (
    <>
      <nav
        style={{
          position: 'fixed',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 220,
          width: isMobile ? 'calc(100% - 32px)' : 'min(1000px, calc(100% - 48px))',
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
        <Link to="/" style={{ textDecoration: 'none', position: 'relative', display: 'inline-flex', cursor: 'pointer' }}>
          <BrandLogo size={isMobile ? 'sm' : 'nav'} />
        </Link>

        {isMobile ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link
              to="/contact"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#18181a', color: '#fff',
                padding: '8px 16px', borderRadius: 100,
                fontSize: 12, fontWeight: 500,
                textDecoration: 'none', whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
            >
              Contact
            </Link>
            <button
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMenuOpen(v => !v)}
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                border: '1px solid rgba(0,0,0,0.1)',
                background: 'white',
                color: '#18181a',
                fontSize: 18,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {menuOpen ? (
                  <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
                ) : (
                  <><line x1="3" y1="7" x2="21" y2="7" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="17" x2="21" y2="17" /></>
                )}
              </svg>
            </button>
          </div>
        ) : (
          <ul style={{ display: 'flex', alignItems: 'center', gap: 2, listStyle: 'none', margin: 0, padding: 0 }}>
            {/* Services dropdown */}
            <li
              style={{ position: 'relative' }}
              onMouseEnter={() => setServicesOpen(true)}
              onMouseLeave={() => setServicesOpen(false)}
            >
              <button
                style={{
                  textDecoration: 'none',
                  color: ['/services', '/web-design-jacksonville-fl', '/seo-services-jacksonville-fl'].includes(location.pathname) ? '#18181a' : '#7a7888',
                  fontSize: 14, fontWeight: 400,
                  padding: '7px 14px', borderRadius: 100,
                  display: 'flex', alignItems: 'center', gap: 5,
                  cursor: 'pointer', background: 'transparent', border: 'none',
                  transition: 'color 0.18s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#18181a' }}
                onMouseLeave={e => {
                  if (!['/services', '/web-design-jacksonville-fl', '/seo-services-jacksonville-fl'].includes(location.pathname)) {
                    e.currentTarget.style.color = '#7a7888'
                  }
                }}
              >
                Services
                <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
                  style={{ transition: 'transform 0.2s', transform: servicesOpen ? 'rotate(180deg)' : 'none' }}>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              <AnimatePresence>
                {servicesOpen && (
                  <Motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.97 }}
                    transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      position: 'absolute', top: 'calc(100% + 10px)', left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(250,249,247,0.97)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      border: '1px solid rgba(0,0,0,0.08)',
                      borderRadius: 16, padding: '8px',
                      minWidth: 260,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.05)',
                      zIndex: 300,
                    }}
                  >
                    {servicesDropdown.map(item => (
                      <Link
                        key={item.href}
                        to={item.href}
                        style={{
                          display: 'flex', flexDirection: 'column',
                          padding: '10px 14px', borderRadius: 10,
                          textDecoration: 'none',
                          transition: 'background 0.15s',
                          background: location.pathname === item.href ? 'rgba(184,144,106,0.08)' : 'transparent',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = location.pathname === item.href ? 'rgba(184,144,106,0.08)' : 'transparent' }}
                      >
                        <span style={{ fontSize: 13.5, fontWeight: 500, color: '#18181a', letterSpacing: '-0.1px' }}>{item.label}</span>
                        <span style={{ fontSize: 12, color: '#7a7888', marginTop: 1, fontWeight: 300 }}>{item.desc}</span>
                      </Link>
                    ))}
                  </Motion.div>
                )}
              </AnimatePresence>
            </li>

            {links.map(([label, to]) => {
              const isLampActive = to === '/' ? location.pathname === '/' : location.pathname === to
              return (
                <li key={label}>
                  <NavLink
                    to={to}
                    end={to === '/'}
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
                      cursor: 'pointer',
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
                      <Motion.div
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
                      </Motion.div>
                    )}
                  </NavLink>
                </li>
              )
            })}
            <li>
              <Link
                to="/contact"
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
              </Link>
            </li>
          </ul>
        )}
      </nav>

      {/* Full-screen mobile overlay */}
      <AnimatePresence>
        {isMobile && menuOpen && (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 210,
              background: 'rgba(245,243,240,0.97)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '80px 32px 40px',
            }}
          >
            {/* Close button */}
            <button
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
              style={{
                position: 'absolute', top: 24, right: 20,
                width: 44, height: 44, borderRadius: '50%',
                border: '1px solid rgba(0,0,0,0.1)',
                background: 'white', color: '#18181a',
                cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Logo */}
            <div style={{ position: 'absolute', top: 24, left: 24 }}>
              <BrandLogo size="sm" />
            </div>

            {/* Nav links — staggered animation */}
            <nav style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              {/* Service landing page links */}
              {servicesDropdown.map((item, i) => (
                <Motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    to={item.href}
                    onClick={() => setMenuOpen(false)}
                    style={{
                      textDecoration: 'none',
                      fontFamily: '"DM Serif Display", serif',
                      fontSize: location.pathname === item.href ? 26 : 22,
                      color: location.pathname === item.href ? '#b8906a' : '#18181a',
                      fontWeight: 400,
                      padding: '6px 24px',
                      display: 'block',
                      textAlign: 'center',
                      letterSpacing: '-0.5px',
                      transition: 'color 0.18s',
                    }}
                  >
                    {item.label}
                  </Link>
                </Motion.div>
              ))}
              <div style={{ width: 32, height: 1, background: 'rgba(0,0,0,0.08)', margin: '8px 0' }} />
              {links.map(([label, to], i) => (
                <Motion.div
                  key={label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (i + servicesDropdown.length) * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <NavLink
                    to={to}
                    end={to === '/'}
                    onClick={() => setMenuOpen(false)}
                    style={({ isActive }) => ({
                      textDecoration: 'none',
                      fontFamily: '"DM Serif Display", serif',
                      fontSize: 28,
                      color: isActive ? '#b8906a' : '#18181a',
                      fontWeight: 400,
                      padding: '8px 24px',
                      display: 'block',
                      textAlign: 'center',
                      letterSpacing: '-0.5px',
                      transition: 'color 0.18s',
                    })}
                  >
                    {label}
                  </NavLink>
                </Motion.div>
              ))}
            </nav>

            {/* CTA button */}
            <Motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: links.length * 0.05 + 0.1, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              style={{ marginTop: 32 }}
            >
              <Link
                to="/contact"
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  background: '#18181a', color: '#fff',
                  padding: '16px 36px', borderRadius: 100,
                  fontSize: 16, fontWeight: 500,
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                }}
              >
                Get in touch →
              </Link>
            </Motion.div>

            {/* Dashboard button */}
            <Motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: links.length * 0.05 + 0.2, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              style={{ position: 'absolute', bottom: 32, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}
            >
              <Link
                to={dashboardLink}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  color: '#7a7888',
                  padding: '10px 20px', borderRadius: 100,
                  fontSize: 13, fontWeight: 500,
                  textDecoration: 'none',
                  border: '1px solid rgba(0,0,0,0.1)',
                  background: 'rgba(250,249,247,0.8)',
                  transition: 'all 0.2s',
                }}
              >
                <DashboardIcon /> Dashboard
              </Link>
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
