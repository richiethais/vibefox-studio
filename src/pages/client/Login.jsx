import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import BrandLogo from '../../components/BrandLogo'

export default function ClientLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else navigate('/client/dashboard')
  }

  return (
    <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f3f0' }}>
      <div style={{ background: 'white', borderRadius: 20, padding: '48px 40px', width: '100%', maxWidth: 400, boxShadow: '0 8px 40px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.06)' }}>
        <BrandLogo size="md" style={{ marginBottom: 6 }} />
        <p style={{ fontSize: 13, color: '#7a7888', marginBottom: 32 }}>Client portal</p>

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
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p style={{ fontSize: 12, color: '#7a7888', textAlign: 'center', marginTop: 20 }}>
          Access is by invitation only.
        </p>
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
