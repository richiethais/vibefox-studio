import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import BrandLogo from '../BrandLogo'
import SEOHead from '../SEOHead'

const navItems = [
  { to: '/client/dashboard', label: 'Dashboard' },
  { to: '/client/projects', label: 'Projects' },
  { to: '/client/invoices', label: 'Invoices' },
  { to: '/client/messages', label: 'Messages' },
  { to: '/client/requests', label: 'Requests' },
]

export default function ClientLayout() {
  const navigate = useNavigate()

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/client/login')
  }

  return (
    <div style={{ minHeight: '100svh', fontFamily: 'system-ui, sans-serif', background: '#f8f6f2' }}>
      <SEOHead
        title="Client Portal"
        description="Client portal"
        path="/client"
        noindex
      />
      <header style={{ background: 'white', borderBottom: '1px solid rgba(0,0,0,0.08)', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
        <BrandLogo size="xs" />
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
      </header>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 32px' }}>
        <Outlet />
      </div>
    </div>
  )
}
