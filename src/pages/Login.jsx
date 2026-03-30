import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setAuthPersistenceMode, supabase } from '../lib/supabase'
import BrandLogo from '../components/BrandLogo'
import useIsMobile from '../components/useIsMobile'

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL

export default function Login() {
  const navigate = useNavigate()
  const isMobile = useIsMobile(768)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setAuthPersistenceMode('local')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    navigate(data.user?.email === ADMIN_EMAIL ? '/admin/dashboard' : '/client/dashboard')
  }

  return (
    <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f3f0' }}>
      <div style={{ background: 'white', borderRadius: 20, padding: isMobile ? '32px 24px' : '48px 40px', width: '100%', maxWidth: 400, boxShadow: '0 8px 40px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.06)' }}>
        <BrandLogo size="md" style={{ marginBottom: 6 }} />
        <p style={{ fontSize: 13, color: '#7a7888', marginBottom: 32 }}>Sign in to your dashboard</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={inputStyle}
          />
          {error && <p style={{ fontSize: 13, color: '#dc2626', margin: 0 }}>{error}</p>}
          <button type="submit" disabled={loading} style={btnStyle}>
            {loading ? 'Signing in\u2026' : 'Sign in'}
          </button>
        </form>
        <a href="/reset-password" style={{ fontSize: 12, color: '#7a7888', textAlign: 'center', display: 'block', marginTop: 20 }}>
          Forgot password?
        </a>
      </div>
    </div>
  )
}

const inputStyle = {
  padding: '12px 16px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)',
  fontSize: 14, color: '#18181a', outline: 'none', width: '100%', boxSizing: 'border-box',
  background: '#faf9f7',
}

const btnStyle = {
  padding: '13px', borderRadius: 10, border: 'none', background: '#18181a',
  color: 'white', fontSize: 14, fontWeight: 500, cursor: 'pointer', marginTop: 4,
}
