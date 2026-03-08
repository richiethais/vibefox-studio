const SIZE_MAP = {
  xs: { mark: 22, font: 17, gap: 9 },
  sm: { mark: 20, font: 15, gap: 8 },
  md: { mark: 34, font: 24, gap: 12 },
  nav: { mark: 28, font: 19, gap: 10 },
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
        alignItems: 'flex-end',
        gap: ui.gap,
        textDecoration: 'none',
        ...style,
      }}
    >
      <img
        src="/image2vector.svg"
        alt="VibefoxStudio logo"
        style={{
          height: ui.mark,
          width: 'auto',
          display: 'block',
          flexShrink: 0,
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
