import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import BrandLogo from '../../components/BrandLogo'
import useIsMobile from '../../components/useIsMobile'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/useAuth'

const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || '').trim().toLowerCase()

function getHashParams(hash) {
  return new URLSearchParams((hash || '').replace(/^#/, ''))
}

export default function AdminAccessLinkRedeem() {
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useIsMobile(768)
  const session = useAuth()
  const [searchParams] = useSearchParams()
  const [state, setState] = useState({
    status: searchParams.get('token') ? 'loading' : 'error',
    text: searchParams.get('token') ? 'Opening secure admin access…' : 'This admin access link is invalid.',
  })
  const token = (searchParams.get('token') || '').trim()
  const resolveAttemptedRef = useRef('')
  const consumeAttemptedRef = useRef('')

  useEffect(() => {
    const hashParams = getHashParams(location.hash)
    const hashError = hashParams.get('error_description') || hashParams.get('error')
    const hasAuthPayload = Boolean(
      hashParams.get('access_token') ||
      hashParams.get('refresh_token') ||
      hashParams.get('type') ||
      hashError
    )

    if (!token) {
      setState({ status: 'error', text: 'This admin access link is invalid.' })
      return
    }

    if (hashError) {
      setState({ status: 'error', text: hashError })
      return
    }

    if (session === undefined || (hasAuthPayload && !session)) {
      setState({
        status: 'loading',
        text: hasAuthPayload ? 'Finishing admin sign-in…' : 'Opening secure admin access…',
      })
      return
    }

    const signedInEmail = (session?.user?.email || '').trim().toLowerCase()

    if (signedInEmail && signedInEmail !== ADMIN_EMAIL) {
      setState({
        status: 'error',
        text: 'This browser is signed into a different account. Sign out first, then open the link again.',
      })
      return
    }

    if (signedInEmail === ADMIN_EMAIL && hasAuthPayload) {
      const consumeKey = `${token}:${location.hash}`
      if (consumeAttemptedRef.current === consumeKey) return
      consumeAttemptedRef.current = consumeKey

      setState({ status: 'loading', text: 'Finalizing admin access…' })

      void (async () => {
        try {
          await supabase.functions.invoke('admin-login-links', {
            body: { action: 'consume', token },
            headers: session?.access_token
              ? { Authorization: `Bearer ${session.access_token}` }
              : undefined,
          })
        } finally {
          navigate('/admin/dashboard', { replace: true })
        }
      })()

      return
    }

    if (!hasAuthPayload) {
      if (resolveAttemptedRef.current === token) return
      resolveAttemptedRef.current = token
      setState({ status: 'loading', text: 'Opening secure admin access…' })

      void (async () => {
        const { data, error } = await supabase.functions.invoke('admin-login-links', {
          body: { action: 'resolve', token },
        })

        if (error || !data?.action_link) {
          setState({
            status: 'error',
            text: error?.message || 'This admin access link is no longer valid.',
          })
          resolveAttemptedRef.current = ''
          return
        }

        window.location.replace(data.action_link)
      })()

      return
    }

    setState({ status: 'loading', text: 'Finishing admin sign-in…' })
  }, [location.hash, navigate, session, token])

  return (
    <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f3f0', padding: 20 }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
        background: 'white',
        borderRadius: 20,
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 10px 36px rgba(0,0,0,0.08)',
        padding: isMobile ? '32px 24px' : '42px 36px',
      }}>
        <BrandLogo size="md" style={{ marginBottom: 8 }} />
        <p style={{ margin: '0 0 18px', color: '#7a7888', fontSize: 13 }}>Admin access</p>

        <div style={{
          borderRadius: 14,
          border: `1px solid ${state.status === 'error' ? '#fecaca' : '#e5e7eb'}`,
          background: state.status === 'error' ? '#fef2f2' : '#faf8f5',
          color: state.status === 'error' ? '#b91c1c' : '#374151',
          fontSize: 14,
          lineHeight: 1.65,
          padding: '16px 18px',
        }}>
          {state.text}
        </div>

        <div style={{ marginTop: 18, fontSize: 12, color: '#6b7280', lineHeight: 1.65 }}>
          {state.status === 'loading'
            ? 'Do not close this tab while the sign-in is completing.'
            : 'If the link expired or was already used, create a new one from the admin CRM.'}
        </div>

        {state.status === 'error' && (
          <div style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link to="/admin/login" style={linkBtnStyle}>Admin login</Link>
            <button
              onClick={() => window.location.reload()}
              style={{ ...linkBtnStyle, border: '1px solid rgba(0,0,0,0.1)', background: 'white', color: '#18181a' }}
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const linkBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 10,
  border: 'none',
  background: '#18181a',
  color: 'white',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
  padding: '11px 14px',
  textDecoration: 'none',
}
