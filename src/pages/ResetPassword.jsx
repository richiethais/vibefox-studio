import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import BrandLogo from '../components/BrandLogo'
import useIsMobile from '../components/useIsMobile'

export default function ResetPassword() {
  const isMobile = useIsMobile(768)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [recovery, setRecovery] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleRequestReset(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) setError(error.message)
    else setSent(true)
    setLoading(false)
  }

  async function handleUpdatePassword(e) {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) setError(error.message)
    else setDone(true)
    setLoading(false)
  }

  let content
  if (done) {
    content = (
      <>
        <p style={{ fontSize: 14, color: '#18181a', marginBottom: 20 }}>
          Your password has been updated.
        </p>
        <a href="/client/login" style={linkStyle}>Back to sign in</a>
      </>
    )
  } else if (recovery) {
    content = (
      <form onSubmit={handleUpdatePassword} style={formStyle}>
        <p style={{ fontSize: 14, color: '#18181a', margin: '0 0 4px' }}>Set a new password</p>
        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
          style={inputStyle}
        />
        {error && <p style={errorStyle}>{error}</p>}
        <button type="submit" disabled={loading} style={btnStyle}>
          {loading ? 'Updating…' : 'Update password'}
        </button>
      </form>
    )
  } else if (sent) {
    content = (
      <>
        <p style={{ fontSize: 14, color: '#18181a', marginBottom: 8 }}>
          Check your email for a reset link.
        </p>
        <p style={{ fontSize: 12, color: '#7a7888' }}>
          If you don't see it, check your spam folder.
        </p>
      </>
    )
  } else {
    content = (
      <form onSubmit={handleRequestReset} style={formStyle}>
        <p style={{ fontSize: 14, color: '#18181a', margin: '0 0 4px' }}>
          Enter your email to receive a reset link.
        </p>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={inputStyle}
        />
        {error && <p style={errorStyle}>{error}</p>}
        <button type="submit" disabled={loading} style={btnStyle}>
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
        <a href="/client/login" style={linkStyle}>Back to sign in</a>
      </form>
    )
  }

  return (
    <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f3f0' }}>
      <div style={{ background: 'white', borderRadius: 20, padding: isMobile ? '32px 24px' : '48px 40px', width: '100%', maxWidth: 400, boxShadow: '0 8px 40px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.06)' }}>
        <BrandLogo size="md" style={{ marginBottom: 6 }} />
        <p style={{ fontSize: 13, color: '#7a7888', marginBottom: 32 }}>Reset password</p>
        {content}
      </div>
    </div>
  )
}

const formStyle = { display: 'flex', flexDirection: 'column', gap: 14 }

const inputStyle = {
  padding: '12px 16px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)',
  fontSize: 14, color: '#18181a', outline: 'none', width: '100%', boxSizing: 'border-box',
  background: '#faf9f7',
}

const btnStyle = {
  padding: '13px', borderRadius: 10, border: 'none', background: '#18181a',
  color: 'white', fontSize: 14, fontWeight: 500, cursor: 'pointer', marginTop: 4,
}

const errorStyle = { fontSize: 13, color: '#dc2626', margin: 0 }

const linkStyle = { fontSize: 13, color: '#7a7888', textAlign: 'center', marginTop: 8, display: 'block' }
