const SIZE_MAP = {
  xs: { mark: 24, font: 17, gap: 9 },
  sm: { mark: 22, font: 15, gap: 8 },
  md: { mark: 36, font: 24, gap: 12 },
  nav: { mark: 32, font: 19, gap: 10 },
}

export default function BrandLogo({
  href,
  size = 'md',
  textColor = '#18181a',
  accentColor = '#d7a063',
  style,
}) {
  const ui = SIZE_MAP[size] || SIZE_MAP.md
  const Wrapper = href ? 'a' : 'span'

  return (
    <Wrapper
      href={href}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: ui.gap,
        textDecoration: 'none',
        ...style,
      }}
    >
      <img
        src="/logo-mark.png"
        alt="VibefoxStudio logo"
        style={{
          height: ui.mark,
          width: 'auto',
          display: 'block',
          flexShrink: 0,
          transform: 'translateY(-5px)',
        }}
      />
      <span
        style={{
          fontFamily: '"DM Serif Display", serif',
          fontSize: ui.font,
          letterSpacing: '-0.3px',
          color: textColor,
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}
      >
        Vibefox <span style={{ color: accentColor }}>Studio</span>
      </span>
    </Wrapper>
  )
}
