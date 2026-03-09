import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import BrandLogo from '../BrandLogo'
import SEOHead from '../SEOHead'
import useIsMobile from '../useIsMobile'

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/inquiries', label: 'Inquiries' },
  { to: '/admin/clients', label: 'Clients' },
  { to: '/admin/projects', label: 'Projects' },
  { to: '/admin/invoices', label: 'Invoices' },
  { to: '/admin/messages', label: 'Messages' },
  { to: '/admin/notes', label: 'Notes' },
  { to: '/admin/blogs', label: 'Blogs' },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const isMobile = useIsMobile(768)
  const [menuOpen, setMenuOpen] = useState(false)

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/admin/login')
  }

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100svh', fontFamily: 'system-ui, sans-serif' }}>
        <SEOHead title="Admin Portal" description="Admin portal" path="/admin" noindex />
        <header style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: '#18181a', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 16px', height: 52,
        }}>
          <BrandLogo size="xs" textColor="rgba(255,255,255,0.88)" accentColor="#dca66b" />
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: 22, cursor: 'pointer', padding: 8 }}
            aria-label="Toggle menu"
          >
            {menuOpen ? '\u2715' : '\u2630'}
          </button>
        </header>

        {menuOpen && (
          <>
            <div
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40 }}
              onClick={() => setMenuOpen(false)}
            />
            <aside style={{
              position: 'fixed', top: 52, left: 0, bottom: 0, width: 260, zIndex: 45,
              background: '#18181a', display: 'flex', flexDirection: 'column',
              boxShadow: '4px 0 24px rgba(0,0,0,0.3)',
            }}>
              <nav style={{ flex: 1, padding: '10px 10px', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
                {navItems.map(({ to, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setMenuOpen(false)}
                    style={({ isActive }) => ({
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '12px 14px', borderRadius: 10, marginBottom: 2,
                      fontSize: 15, textDecoration: 'none',
                      background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                      color: isActive ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.45)',
                      fontWeight: isActive ? 500 : 400,
                    })}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
                    {label}
                  </NavLink>
                ))}
              </nav>
              <button
                onClick={signOut}
                style={{ margin: 12, padding: '12px', borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', fontSize: 14, cursor: 'pointer' }}
              >
                Sign out
              </button>
            </aside>
          </>
        )}

        <main style={{ flex: 1, background: '#f8f6f2', overflow: 'auto' }}>
          <Outlet />
        </main>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100svh', fontFamily: 'system-ui, sans-serif' }}>
      <SEOHead title="Admin Portal" description="Admin portal" path="/admin" noindex />
      <aside style={{ width: 200, background: '#18181a', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '22px 18px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <BrandLogo size="sm" textColor="rgba(255,255,255,0.88)" accentColor="#dca66b" />
        </div>

        <nav style={{ flex: 1, padding: '10px 10px' }}>
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 10px', borderRadius: 8, marginBottom: 2,
                fontSize: 13, textDecoration: 'none',
                background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: isActive ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.38)',
              })}
            >
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
              {label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={signOut}
          style={{ margin: 12, padding: '9px', borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.38)', fontSize: 12, cursor: 'pointer' }}
        >
          Sign out
        </button>
      </aside>

      <main style={{ flex: 1, background: '#f8f6f2', overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  )
}
