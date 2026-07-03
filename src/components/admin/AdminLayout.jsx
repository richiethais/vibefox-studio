import { useEffect, useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { clearAuthPersistenceMode, supabase } from '../../lib/supabase'
import BrandLogo from '../BrandLogo'
import SEOHead from '../SEOHead'
import useIsMobile from '../useIsMobile'

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/inquiries', label: 'Inquiries' },
  { to: '/admin/coaching', label: 'Coaching' },
  { to: '/admin/support', label: 'Support' },
  { to: '/admin/clients', label: 'Clients' },
  { to: '/admin/projects', label: 'Projects' },
  { to: '/admin/invoices', label: 'Billing' },
  { to: '/admin/messages', label: 'Messages' },
  { to: '/admin/notes', label: 'Client Notes' },
  { to: '/admin/seo-notes', label: 'SEO Notes' },
  { to: '/admin/calendar', label: 'Calendar' },
  { to: '/admin/blogs', label: 'Blogs' },
  { to: '/admin/access-links', label: 'Access Links' },
]

// Mobile: grouped drawer sections + a bottom tab bar for the daily-driver pages.
const mobileNavSections = [
  { title: 'Leads', items: [
    { to: '/admin/inquiries', label: 'Inquiries' },
    { to: '/admin/coaching', label: 'Coaching' },
    { to: '/admin/support', label: 'Support' },
  ] },
  { title: 'Clients & Work', items: [
    { to: '/admin/clients', label: 'Clients' },
    { to: '/admin/projects', label: 'Projects' },
    { to: '/admin/invoices', label: 'Billing' },
    { to: '/admin/messages', label: 'Messages' },
  ] },
  { title: 'Content', items: [
    { to: '/admin/blogs', label: 'Blogs' },
    { to: '/admin/calendar', label: 'Calendar' },
    { to: '/admin/notes', label: 'Client Notes' },
    { to: '/admin/seo-notes', label: 'SEO Notes' },
  ] },
  { title: 'Settings', items: [
    { to: '/admin/access-links', label: 'Access Links' },
  ] },
]

const tabIcons = {
  Dashboard: <path d="M3 12l9-8 9 8M5 10v10h4v-6h6v6h4V10" />,
  Inquiries: <><path d="M22 6l-10 7L2 6" /><rect x="2" y="4" width="20" height="16" rx="2" /></>,
  Messages: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  Billing: <><line x1="12" y1="2" x2="12" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>,
  Menu: <><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></>,
}

const bottomTabs = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/inquiries', label: 'Inquiries' },
  { to: '/admin/messages', label: 'Messages' },
  { to: '/admin/invoices', label: 'Billing' },
]

function TabIcon({ name, active }) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={active ? '#18181a' : '#9c9aa6'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {tabIcons[name]}
    </svg>
  )
}

export default function AdminLayout() {
  const navigate = useNavigate()
  const isMobile = useIsMobile(768)
  const [menuOpen, setMenuOpen] = useState(false)

  async function signOut() {
    try { localStorage.removeItem('vf_access_link_token') } catch {}
    clearAuthPersistenceMode()
    await supabase.auth.signOut()
    navigate('/admin/login')
  }

  // Check if this session was logged in via an access link that has been revoked
  useEffect(() => {
    let active = true

    async function checkRevocation() {
      let token
      try { token = localStorage.getItem('vf_access_link_token') } catch {}
      if (!token) return

      const { data } = await supabase
        .from('admin_login_links')
        .select('revoked_at')
        .eq('token', token)
        .maybeSingle()

      if (!active) return

      if (data?.revoked_at) {
        try { localStorage.removeItem('vf_access_link_token') } catch {}
        clearAuthPersistenceMode()
        await supabase.auth.signOut()
        navigate('/admin/login')
      }
    }

    checkRevocation()
    const timer = setInterval(checkRevocation, 10_000)
    return () => { active = false; clearInterval(timer) }
  }, [navigate])

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
            onClick={signOut}
            style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 100, color: 'rgba(255,255,255,0.7)', fontSize: 12, cursor: 'pointer', padding: '8px 14px' }}
          >
            Sign out
          </button>
        </header>

        {menuOpen && (
          <>
            <div
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 60 }}
              onClick={() => setMenuOpen(false)}
            />
            <aside style={{
              position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 65,
              background: '#18181a', borderRadius: '20px 20px 0 0',
              maxHeight: '78vh', display: 'flex', flexDirection: 'column',
              boxShadow: '0 -12px 40px rgba(0,0,0,0.35)',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 6px' }}>
                <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 15, fontWeight: 600 }}>All pages</div>
                <button
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                  style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 15, height: 32, width: 32 }}
                >
                  {'\u2715'}
                </button>
              </div>
              <nav style={{ flex: 1, padding: '4px 12px 16px', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
                {mobileNavSections.map(section => (
                  <div key={section.title} style={{ marginBottom: 10 }}>
                    <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 600, letterSpacing: '0.8px', padding: '10px 10px 6px', textTransform: 'uppercase' }}>
                      {section.title}
                    </div>
                    <div style={{ display: 'grid', gap: 4, gridTemplateColumns: '1fr 1fr' }}>
                      {section.items.map(({ to, label }) => (
                        <NavLink
                          key={to}
                          to={to}
                          onClick={() => setMenuOpen(false)}
                          style={({ isActive }) => ({
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '13px 12px', borderRadius: 10,
                            fontSize: 14, textDecoration: 'none',
                            background: isActive ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.03)',
                            color: isActive ? 'white' : 'rgba(255,255,255,0.6)',
                            fontWeight: isActive ? 600 : 400,
                          })}
                        >
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#dca66b', flexShrink: 0 }} />
                          {label}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                ))}
              </nav>
            </aside>
          </>
        )}

        <main style={{ flex: 1, background: '#f8f6f2', overflow: 'auto', paddingBottom: 'calc(68px + env(safe-area-inset-bottom))' }}>
          <Outlet />
        </main>

        {/* Bottom tab bar */}
        <nav style={{
          position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 55,
          background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          borderTop: '1px solid rgba(0,0,0,0.08)',
          display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
          {bottomTabs.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              style={{ textDecoration: 'none' }}
            >
              {({ isActive }) => (
                <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '9px 0 7px' }}>
                  <TabIcon name={label} active={isActive} />
                  <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 500, color: isActive ? '#18181a' : '#9c9aa6' }}>{label}</span>
                </span>
              )}
            </NavLink>
          ))}
          <button
            onClick={() => setMenuOpen(open => !open)}
            aria-label="More pages"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '9px 0 7px' }}>
              <TabIcon name="Menu" active={menuOpen} />
              <span style={{ fontSize: 10, fontWeight: menuOpen ? 600 : 500, color: menuOpen ? '#18181a' : '#9c9aa6' }}>More</span>
            </span>
          </button>
        </nav>
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
