// Shared mobile-friendly replacements for the admin data tables.
// Tables stay on desktop; on phones each row becomes a tappable card.

export function MobileCardList({ loading, loadingText = 'Loading…', emptyText = 'Nothing here yet.', children }) {
  const hasChildren = Array.isArray(children) ? children.some(Boolean) : Boolean(children)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {loading && <div style={{ color: '#7a7888', fontSize: 13, padding: '14px 2px' }}>{loadingText}</div>}
      {!loading && !hasChildren && (
        <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 12, color: '#7a7888', fontSize: 13, padding: '20px 16px', textAlign: 'center' }}>
          {emptyText}
        </div>
      )}
      {!loading && children}
    </div>
  )
}

export function MobileCard({ onClick, selected, children }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: selected ? '#f8f6f2' : 'white',
        border: '1px solid rgba(0,0,0,0.07)',
        borderRadius: 12,
        cursor: onClick ? 'pointer' : 'default',
        padding: '14px 16px',
      }}
    >
      {children}
    </div>
  )
}

// Title on the left, badge(s) on the right.
export function MobileCardHeader({ title, right }) {
  return (
    <div style={{ alignItems: 'flex-start', display: 'flex', gap: 10, justifyContent: 'space-between', marginBottom: 6 }}>
      <div style={{ color: '#18181a', fontSize: 14, fontWeight: 600, lineHeight: 1.35, minWidth: 0, overflowWrap: 'anywhere' }}>{title}</div>
      {right && <div style={{ alignItems: 'center', display: 'flex', flexShrink: 0, gap: 6 }}>{right}</div>}
    </div>
  )
}

export function MobileCardMeta({ children }) {
  return <div style={{ color: '#7a7888', fontSize: 12, lineHeight: 1.6, overflowWrap: 'anywhere' }}>{children}</div>
}

// Bottom action row: full-width, touch-friendly buttons.
export function MobileCardActions({ children }) {
  return (
    <div
      onClick={event => event.stopPropagation()}
      style={{ borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12, paddingTop: 12 }}
    >
      {children}
    </div>
  )
}

