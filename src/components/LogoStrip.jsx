export default function LogoStrip() {
  return (
    <div style={{ padding: '44px 40px', background: '#faf9f7', borderTop: '1px solid rgba(0,0,0,0.08)', borderBottom: '1px solid rgba(0,0,0,0.08)', textAlign: 'center' }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: '#7a7888', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 24 }}>
        Trusted by Jacksonville small businesses
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 52, flexWrap: 'wrap', opacity: 0.28 }}>
        {['Bloom & Co', 'Meridian Fit', 'Harlow Studio', 'Cedar & Oak', 'Volta Media'].map(name => (
          <div key={name} style={{ fontFamily: '"DM Serif Display", serif', fontSize: 18, color: '#18181a' }}>{name}</div>
        ))}
      </div>
    </div>
  )
}
