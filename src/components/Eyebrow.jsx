function EyebrowGlyph() {
  return (
    <span
      style={{
        width: 20,
        height: 20,
        background: 'rgba(200,169,126,0.15)',
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          border: '1.5px solid #b8906a',
          boxShadow: 'inset 0 0 0 1px rgba(184,144,106,0.14)',
        }}
      />
    </span>
  )
}

export default function Eyebrow({ children }) {
  return (
    <div
      className="fade-up"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 12,
        fontWeight: 500,
        color: '#b8906a',
        textTransform: 'uppercase',
        letterSpacing: '1.5px',
        marginBottom: 18,
      }}
    >
      <EyebrowGlyph />
      {children}
    </div>
  )
}
