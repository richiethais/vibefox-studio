import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import BrandLogo from '../BrandLogo'
import SEOHead from '../SEOHead'
import useIsMobile from '../useIsMobile'

const navItems = [
  { to: '/client/dashboard', label: 'Dashboard' },
  { to: '/client/projects', label: 'Projects' },
  { to: '/client/invoices', label: 'Invoices' },
  { to: '/client/messages', label: 'Messages' },
  { to: '/client/support', label: 'Support' },
]

export default function ClientLayout() {
  const navigate = useNavigate()
  const isMobile = useIsMobile(768)
  const [menuOpen, setMenuOpen] = useState(false)

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/client/login')
  }

  return (
    <div style={{ minHeight: '100svh', fontFamily: 'system-ui, sans-serif', background: '#f8f6f2' }}>
      <SEOHead title="Client Portal" description="Client portal" path="/client" noindex />
      <header style={{
        background: 'white', borderBottom: '1px solid rgba(0,0,0,0.08)',
        padding: isMobile ? '0 16px' : '0 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56,
        position: isMobile ? 'sticky' : undefined, top: isMobile ? 0 : undefined, zIndex: isMobile ? 50 : undefined,
      }}>
        <BrandLogo size="xs" />
        {isMobile ? (
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: 'none', border: 'none', color: '#18181a', fontSize: 22, cursor: 'pointer', padding: 8 }}
            aria-label="Toggle menu"
          >
            {menuOpen ? '\u2715' : '\u2630'}
          </button>
        ) : (
          <>
            <nav style={{ display: 'flex', gap: 4 }}>
              {navItems.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  style={({ isActive }) => ({
                    padding: '6px 14px', borderRadius: 100, fontSize: 13, textDecoration: 'none',
                    color: isActive ? '#18181a' : '#7a7888',
                    background: isActive ? 'rgba(0,0,0,0.06)' : 'transparent',
                  })}
                >
                  {label}
                </NavLink>
              ))}
            </nav>
            <button
              onClick={signOut}
              style={{ padding: '7px 16px', borderRadius: 100, border: '1px solid rgba(0,0,0,0.1)', background: 'transparent', fontSize: 13, color: '#7a7888', cursor: 'pointer' }}
            >
              Sign out
            </button>
          </>
        )}
      </header>

      {isMobile && menuOpen && (
        <div style={{
          background: 'white', borderBottom: '1px solid rgba(0,0,0,0.08)',
          padding: '8px 12px 12px', display: 'flex', flexDirection: 'column', gap: 2,
          position: 'sticky', top: 56, zIndex: 49,
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
        }}>
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              style={({ isActive }) => ({
                padding: '11px 14px', borderRadius: 10, fontSize: 15, textDecoration: 'none',
                color: isActive ? '#18181a' : '#7a7888',
                background: isActive ? 'rgba(0,0,0,0.04)' : 'transparent',
                fontWeight: isActive ? 500 : 400,
              })}
            >
              {label}
            </NavLink>
          ))}
          <button
            onClick={signOut}
            style={{ padding: '11px 14px', borderRadius: 10, border: 'none', background: 'transparent', fontSize: 15, color: '#7a7888', cursor: 'pointer', textAlign: 'left', marginTop: 4, borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 14 }}
          >
            Sign out
          </button>
        </div>
      )}

      <div style={{ maxWidth: 900, margin: '0 auto', padding: isMobile ? '24px 16px' : '40px 32px' }}>
        <Outlet />
      </div>
    </div>
  )
}
