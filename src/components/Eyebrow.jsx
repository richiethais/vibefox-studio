export default function Eyebrow({ icon, children }) {
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
      <span
        style={{
          width: 20,
          height: 20,
          background: 'rgba(200,169,126,0.15)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
        }}
      >
        {icon}
      </span>
      {children}
    </div>
  )
}
