import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import BrandLogo from '../components/BrandLogo'
import SEOHead from '../components/SEOHead'
import useIsMobile from '../components/useIsMobile'

export default function Join() {
  const isMobile = useIsMobile(768)
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token')

  const [linkStatus, setLinkStatus] = useState(token ? 'loading' : 'invalid')
  const [form, setForm] = useState({ name: '', email: '', company: '', phone: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (linkStatus === 'used' || linkStatus === 'expired' || linkStatus === 'invalid') {
      navigate('/', { replace: true })
    }
  }, [linkStatus, navigate])

  useEffect(() => {
    if (!token) {
      return
    }
    supabase
      .from('invite_tokens')
      .select('*')
      .eq('token', token)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setLinkStatus('invalid'); return }
        if (data.used) { setLinkStatus('used'); return }
        if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) { setLinkStatus('expired'); return }
        setForm(f => ({ ...f, name: data.name, email: data.email }))
        setLinkStatus('ready')
      })
  }, [token])

  async function handleSubmit(e) {
    e.preventDefault()
    if (loading) return
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    setError('')

    // Re-check token validity in case it was consumed while the form was open.
    const { data: latestToken, error: tokenError } = await supabase
      .from('invite_tokens')
      .select('used, expires_at')
      .eq('token', token)
      .single()
    if (tokenError || !latestToken) {
      setLoading(false)
      setLinkStatus('invalid')
      return
    }
    if (latestToken.used) {
      setLoading(false)
      setLinkStatus('used')
      return
    }
    if (latestToken.expires_at && new Date(latestToken.expires_at).getTime() < Date.now()) {
      setLoading(false)
      setLinkStatus('expired')
      return
    }

    // Create auth account
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: form.email.trim().toLowerCase(),
      password: form.password,
    })
    if (signUpError) {
      if (/already|registered|exists/i.test(signUpError.message)) {
        await supabase.from('invite_tokens').update({ used: true, expires_at: new Date().toISOString() }).eq('token', token)
        setLoading(false)
        setLinkStatus('used')
        return
      }
      setError(signUpError.message)
      setLoading(false)
      return
    }

    const userId = authData.user?.id
    if (!userId) { setError('Account creation failed. Please try again.'); setLoading(false); return }

    // Upsert client record by email so admin-created clients can complete signup.
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('email', form.email.trim().toLowerCase())
      .maybeSingle()

    let clientError = null
    if (existingClient) {
      const { error } = await supabase
        .from('clients')
        .update({
          user_id: userId,
          name: form.name.trim(),
          company: form.company.trim(),
          phone: form.phone.trim(),
          status: 'active',
        })
        .eq('id', existingClient.id)
      clientError = error
    } else {
      const { error } = await supabase.from('clients').insert({
        user_id: userId,
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        company: form.company.trim(),
        phone: form.phone.trim(),
        plan: 'starter',
        status: 'active',
      })
      clientError = error
    }

    if (clientError) { setError('Account created but profile setup failed: ' + clientError.message); setLoading(false); return }

    // Mark token as used
    await supabase.from('invite_tokens').update({ used: true, expires_at: new Date().toISOString() }).eq('token', token)

    navigate('/client/dashboard')
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  if (linkStatus !== 'ready') {
    if (linkStatus === 'loading') {
      return (
        <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f3f0' }}>
          <SEOHead title="Invite Link Status" description="Invite-only signup" path="/join" noindex />
          <div style={{ fontSize: 13, color: '#7a7888' }}>Loading…</div>
        </div>
      )
    }

    return (
      <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f3f0' }}>
        <SEOHead title="Invite Link Status" description="Invite-only signup" path="/join" noindex />
        <div style={{ fontSize: 13, color: '#7a7888' }}>Redirecting to Vibefox Studio…</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f3f0', padding: '40px 20px' }}>
      <SEOHead title="Create Client Account" description="Invite-only signup" path="/join" noindex />
      <div style={{ background: 'white', borderRadius: 20, padding: isMobile ? '32px 24px' : '48px 40px', width: '100%', maxWidth: 460, boxShadow: '0 8px 40px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.06)' }}>
        <BrandLogo size="md" style={{ marginBottom: 6 }} />
        <p style={{ fontSize: 13, color: '#7a7888', marginBottom: 32 }}>Create your client account</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
            <input placeholder="Full name *" value={form.name} onChange={set('name')} required style={inp} />
            <input placeholder="Email *" type="email" value={form.email} onChange={set('email')} required style={inp} />
          </div>
          <input placeholder="Company" value={form.company} onChange={set('company')} style={inp} />
          <input placeholder="Phone" value={form.phone} onChange={set('phone')} style={inp} />
          <input placeholder="Password *" type="password" value={form.password} onChange={set('password')} required style={inp} />
          {error && <p style={{ fontSize: 13, color: '#dc2626', margin: 0 }}>{error}</p>}
          <button type="submit" disabled={loading || form.password.length < 8} style={{
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
