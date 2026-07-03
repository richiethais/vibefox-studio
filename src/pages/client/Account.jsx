import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useClientRecord } from '../../lib/useClientRecord'

const PLAN_LABELS = {
  starter: 'Starter',
  growth: 'Growth',
  pro: 'Pro',
}

export default function ClientAccount() {
  const { client, loading } = useClientRecord()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)

  async function changePassword(event) {
    event.preventDefault()
    if (saving) return
    if (password.length < 8) {
      setNotice({ type: 'error', text: 'Password must be at least 8 characters.' })
      return
    }
    if (password !== confirm) {
      setNotice({ type: 'error', text: 'Passwords do not match.' })
      return
    }

    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password })
    setSaving(false)

    if (error) {
      setNotice({ type: 'error', text: error.message || 'Could not update password.' })
      return
    }

    setPassword('')
    setConfirm('')
    setNotice({ type: 'success', text: 'Password updated.' })
  }

  if (loading) {
    return (
      <div>
        <h1 style={headingStyle}>Account</h1>
        <div style={{ color: '#7a7888', fontSize: 13 }}>Loading…</div>
      </div>
    )
  }

  return (
    <div>
      <h1 style={headingStyle}>Account</h1>

      {notice && (
        <div style={{
          background: notice.type === 'error' ? '#fef2f2' : '#f0fdf4',
          border: `1px solid ${notice.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
          borderRadius: 10,
          color: notice.type === 'error' ? '#dc2626' : '#16a34a',
          fontSize: 13,
          marginBottom: 14,
          padding: '10px 14px',
        }}>
          {notice.text}
        </div>
      )}

      <div style={card}>
        <h2 style={cardTitle}>Profile</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <Field label="Name" value={client?.name} />
          <Field label="Email" value={client?.email} />
          <Field label="Company" value={client?.company} />
          <Field label="Phone" value={client?.phone} />
          <Field label="Plan" value={client?.plan ? (PLAN_LABELS[client.plan] || client.plan) : null} />
          <Field
            label="Client since"
            value={client?.created_at ? new Date(client.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : null}
          />
        </div>
        <div style={{ fontSize: 12, color: '#7a7888', marginTop: 16, lineHeight: 1.6 }}>
          Need to update your contact details? <Link to="/client/support" style={{ color: '#b8906a' }}>Send us a message</Link> and we'll take care of it.
        </div>
      </div>

      <div style={card}>
        <h2 style={cardTitle}>Change password</h2>
        <form onSubmit={changePassword} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 360 }}>
          <input
            type="password"
            autoComplete="new-password"
            placeholder="New password (8+ characters)"
            value={password}
            onChange={event => setPassword(event.target.value)}
            required
            minLength={8}
            style={inp}
          />
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={event => setConfirm(event.target.value)}
            required
            minLength={8}
            style={inp}
          />
          <button
            type="submit"
            disabled={saving || !password || !confirm}
            style={{
              alignSelf: 'flex-start',
              background: '#18181a',
              border: 'none',
              borderRadius: 100,
              color: 'white',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: 13,
              fontWeight: 500,
              opacity: saving ? 0.6 : 1,
              padding: '11px 20px',
            }}
          >
            {saving ? 'Saving…' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#7a7888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, color: value ? '#18181a' : '#a8a6b3' }}>{value || 'Not set'}</div>
    </div>
  )
}

const headingStyle = { fontSize: 22, fontWeight: 600, color: '#18181a', marginBottom: 24, letterSpacing: '-0.4px' }
const card = { background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, marginBottom: 20, padding: 24 }
const cardTitle = { color: '#18181a', fontSize: 15, fontWeight: 600, marginTop: 0, marginBottom: 18 }
const inp = {
  background: '#faf9f7',
  border: '1px solid rgba(0,0,0,0.1)',
  borderRadius: 10,
  boxSizing: 'border-box',
  color: '#18181a',
  fontFamily: 'inherit',
  fontSize: 13,
  outline: 'none',
  padding: '11px 14px',
  width: '100%',
}
