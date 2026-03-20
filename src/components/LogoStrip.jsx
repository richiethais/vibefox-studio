import useIsMobile from './useIsMobile'

export default function LogoStrip() {
  const isMobile = useIsMobile()

  return (
    <div style={{ padding: isMobile ? '20px 16px' : '44px 40px', background: '#faf9f7', borderTop: '1px solid rgba(0,0,0,0.08)', borderBottom: '1px solid rgba(0,0,0,0.08)', textAlign: 'center' }}>
      <div style={{ fontSize: isMobile ? 9 : 12, fontWeight: 500, color: '#7a7888', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: isMobile ? 10 : 24 }}>
        Trusted by Jacksonville businesses
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? 12 : 52, flexWrap: 'wrap', opacity: 0.28 }}>
        {['Bloom & Co', 'Meridian Fit', 'Harlow Studio', 'Cedar & Oak', 'Volta Media'].map(name => (
          <div key={name} style={{ fontFamily: '"DM Serif Display", serif', fontSize: isMobile ? 12 : 18, color: '#18181a' }}>{name}</div>
        ))}
      </div>
    </div>
  )
}
