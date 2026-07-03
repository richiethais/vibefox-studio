// Touch-friendly action button styles for the mobile admin cards.
export const mobileActionBtn = {
  background: 'white',
  border: '1px solid rgba(0,0,0,0.1)',
  borderRadius: 100,
  color: '#18181a',
  cursor: 'pointer',
  flex: '1 1 auto',
  fontSize: 12,
  fontWeight: 500,
  minHeight: 38,
  padding: '9px 14px',
  textAlign: 'center',
  textDecoration: 'none',
}

export const mobileDangerBtn = {
  ...mobileActionBtn,
  border: '1px solid rgba(220,38,38,0.25)',
  color: '#dc2626',
  flex: '0 1 auto',
}
