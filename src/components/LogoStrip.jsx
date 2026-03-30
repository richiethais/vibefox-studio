import useIsMobile from './useIsMobile'

const clients = [
  { name: 'Olympia Cafe', url: 'https://olympia-cafe.com', color: '#1a5276' },
  { name: 'Fatboy Fried Rice', url: 'https://fatboyfriedrice.com', color: '#c0392b' },
]

export default function LogoStrip() {
  const isMobile = useIsMobile()

  return (
    <div style={{ padding: isMobile ? '40px 24px' : '44px 40px', background: '#faf9f7', borderTop: '1px solid rgba(0,0,0,0.08)', borderBottom: '1px solid rgba(0,0,0,0.08)', textAlign: 'center' }}>
      <div style={{ fontSize: isMobile ? 10 : 12, fontWeight: 500, color: '#7a7888', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: isMobile ? 16 : 24 }}>
        Built for Jacksonville businesses
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? 28 : 52, flexWrap: 'wrap' }}>
        {clients.map(client => (
          <a
            key={client.name}
            href={client.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: isMobile ? 17 : 20,
              fontWeight: 700,
              color: '#18181a',
              textDecoration: 'none',
              opacity: 0.6,
              transition: 'opacity 0.2s, color 0.2s',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = client.color }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.color = '#18181a' }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: client.color, flexShrink: 0 }} />
            {client.name}
          </a>
        ))}
      </div>
    </div>
  )
}
