import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import BrandLogo from '../BrandLogo'
import SEOHead from '../SEOHead'

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/inquiries', label: 'Inquiries' },
  { to: '/admin/clients', label: 'Clients' },
  { to: '/admin/projects', label: 'Projects' },
  { to: '/admin/invoices', label: 'Invoices' },
  { to: '/admin/messages', label: 'Messages' },
  { to: '/admin/notes', label: 'Notes' },
]

export default function AdminLayout() {
  const navigate = useNavigate()

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/admin/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100svh', fontFamily: 'system-ui, sans-serif' }}>
      <SEOHead
        title="Admin Portal"
        description="Admin portal"
        path="/admin"
        noindex
      />
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
