import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import BrandLogo from '../components/BrandLogo'

export default function Join() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token')

  const [tokenData, setTokenData] = useState(null)
  const [invalid, setInvalid] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', company: '', phone: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) { setInvalid(true); return }
    supabase
      .from('invite_tokens')
      .select('*')
      .eq('token', token)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setInvalid(true); return }
        setTokenData(data)
        setForm(f => ({ ...f, name: data.name, email: data.email }))
      })
  }, [token])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Create auth account
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })
    if (signUpError) { setError(signUpError.message); setLoading(false); return }

    const userId = authData.user?.id
    if (!userId) { setError('Account creation failed. Please try again.'); setLoading(false); return }

    // Create client record
    const { error: clientError } = await supabase.from('clients').insert({
      user_id: userId,
      name: form.name,
      email: form.email,
      company: form.company,
      phone: form.phone,
      plan: 'starter',
      status: 'active',
    })
    if (clientError) { setError('Account created but profile setup failed: ' + clientError.message); setLoading(false); return }

    // Mark token as used
    await supabase.from('invite_tokens').update({ used: true }).eq('token', token)

    navigate('/client/dashboard')
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  if (!token || invalid) {
    return (
      <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f3f0' }}>
        <div style={{ background: 'white', borderRadius: 20, padding: '48px 40px', maxWidth: 400, width: '100%', textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>⚠️</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#18181a', marginBottom: 8 }}>Invalid or expired link</div>
          <div style={{ fontSize: 13, color: '#7a7888' }}>This invite link is no longer valid. Please contact Vibefox Studio for a new one.</div>
        </div>
      </div>
    )
  }

  if (!tokenData) {
    return (
      <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f3f0' }}>
        <div style={{ fontSize: 13, color: '#7a7888' }}>Loading…</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f3f0', padding: '40px 20px' }}>
      <div style={{ background: 'white', borderRadius: 20, padding: '48px 40px', width: '100%', maxWidth: 460, boxShadow: '0 8px 40px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.06)' }}>
        <BrandLogo size="md" style={{ marginBottom: 6 }} />
        <p style={{ fontSize: 13, color: '#7a7888', marginBottom: 32 }}>Create your client account</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <input placeholder="Full name *" value={form.name} onChange={set('name')} required style={inp} />
            <input placeholder="Email *" type="email" value={form.email} onChange={set('email')} required style={inp} />
          </div>
          <input placeholder="Company" value={form.company} onChange={set('company')} style={inp} />
          <input placeholder="Phone" value={form.phone} onChange={set('phone')} style={inp} />
          <input placeholder="Password *" type="password" value={form.password} onChange={set('password')} required style={inp} />
          {error && <p style={{ fontSize: 13, color: '#dc2626', margin: 0 }}>{error}</p>}
          <button type="submit" disabled={loading} style={{
            padding: '13px', borderRadius: 10, border: 'none', background: '#18181a',
            color: 'white', fontSize: 14, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1, marginTop: 4,
          }}>
            {loading ? 'Creating account…' : 'Create account →'}
          </button>
        </form>
      </div>
    </div>
  )
}

const inp = {
  padding: '12px 16px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)',
  fontSize: 14, color: '#18181a', outline: 'none', width: '100%', boxSizing: 'border-box',
  background: '#faf9f7', fontFamily: 'inherit',
}
