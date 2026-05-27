import { useState } from 'react'
import { Link } from 'react-router-dom'

const STORAGE_KEY = 'vf_cookie_notice_ack'

export default function CookieNotice() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      return window.localStorage.getItem(STORAGE_KEY) !== 'true'
    } catch {
      return false
    }
  })

  function acknowledge() {
    try {
      window.localStorage.setItem(STORAGE_KEY, 'true')
    } catch {
      // If storage is unavailable, closing the notice for this render is enough.
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      style={{
        position: 'fixed',
        left: 16,
        right: 16,
        bottom: 16,
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: 'min(680px, 100%)',
          border: '1px solid rgba(0,0,0,0.1)',
          borderRadius: 14,
          background: 'rgba(255,255,255,0.98)',
          boxShadow: '0 18px 48px rgba(0,0,0,0.14)',
          color: '#3a3840',
          padding: '14px 14px 14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap',
          pointerEvents: 'auto',
        }}
      >
        <p style={{ flex: '1 1 360px', margin: 0, fontSize: 13, lineHeight: 1.55, color: '#5f5d68' }}>
          We use essential cookies and browser storage for login, security, and site functionality. See our{' '}
          <Link to="/cookie-policy" style={{ color: '#8f6844', fontWeight: 700 }}>
            Cookie Policy
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={acknowledge}
          style={{
            border: 0,
            borderRadius: 10,
            background: '#18181a',
            color: '#fff',
            cursor: 'pointer',
            font: 'inherit',
            fontSize: 13,
            fontWeight: 700,
            padding: '10px 16px',
          }}
        >
          Got it
        </button>
      </div>
    </div>
  )
}
