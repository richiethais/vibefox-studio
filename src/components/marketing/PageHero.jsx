export default function PageHero({ eyebrow, title, sub }) {
  return (
    <section style={{ padding: '42px 40px 24px' }}>
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>
        {eyebrow && (
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#b8906a', marginBottom: 14 }}>
            {eyebrow}
          </div>
        )}
        <h1 style={{
          fontFamily: '"DM Serif Display", serif',
          fontSize: 'clamp(34px, 5vw, 58px)',
          lineHeight: 1.05,
          color: '#18181a',
          letterSpacing: '-1.4px',
          margin: 0,
        }}>
          {title}
        </h1>
        {sub && (
          <p style={{ fontSize: 17, color: '#7a7888', maxWidth: 760, marginTop: 16, fontWeight: 300, lineHeight: 1.68 }}>
            {sub}
          </p>
        )}
      </div>
    </section>
  )
}
