import { useFadeUp } from './useFadeUp'
import Eyebrow from './Eyebrow'
import { h2Style, subStyle } from './sectionStyles'
import useIsMobile from './useIsMobile'

const projects = [
  {
    tag: 'Website',
    title: 'Olympia Cafe',
    url: 'https://olympia-cafe.com',
    desc: 'A full custom website for a beloved Jacksonville Greek cafe, built to showcase the menu, tell the brand story, and make the location easy to find on mobile. The experience focuses on fast load times, clear calls to action, and a warm visual identity that helps turn nearby searchers into in-person diners.',
    heroImg: '/olympia-cafe-hero.webp',
    foodImgs: ['/olympia-gyro.webp', '/olympia-philly.webp', '/olympia-wings.webp'],
    label: 'Restaurant Website',
    sub: 'Greek Cafe · Jacksonville, FL',
    bg: 'linear-gradient(135deg, #e8f0fe 0%, #d4e4ff 100%)',
    accent: '#1a5276',
  },
  {
    tag: 'Website',
    title: 'Fatboy Fried Rice',
    url: 'https://fatboyfriedrice.com',
    desc: 'A bold website for Jacksonville\'s favorite Asian fusion food truck, complete with online ordering, catering details, team highlights, and menu content that is easy to browse on the go. We structured the page to support branded search, local discovery, and fast decision-making for hungry customers ready to order.',
    heroImg: '/fatboy-fried-rice-hero.webp',
    foodImgs: ['/fatboy-sisig.webp', '/fatboy-teriyaki.webp', '/fatboy-team.webp'],
    label: 'Food Truck Website',
    sub: 'Asian Fusion · Jacksonville, FL',
    bg: 'linear-gradient(135deg, #fff0e6 0%, #ffe0cc 100%)',
    accent: '#c0392b',
  },
]

export default function Work({ hideHeader }) {
  const ref = useFadeUp()
  const isMobile = useIsMobile()

  return (
    <section id="work" ref={ref} style={{ padding: isMobile ? '64px 24px' : '96px 40px', overflow: 'hidden' }}>
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>
        {!hideHeader && (
          <>
            <Eyebrow>Our Work</Eyebrow>
            <h2 className="fade-up d1" style={{ ...h2Style, fontSize: isMobile ? 'clamp(26px, 8vw, 36px)' : h2Style.fontSize, letterSpacing: isMobile ? '-1px' : h2Style.letterSpacing }}>
              Real sites for real <em style={{ fontStyle: 'italic', color: '#b8906a' }}>businesses.</em>
            </h2>
            {!isMobile && <p className="fade-up d2" style={subStyle}>Websites we designed, built, and launched for Jacksonville businesses.</p>}
          </>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 32 : 40, marginTop: isMobile ? 28 : 52 }}>
          {projects.map((project, i) => (
            <ProjectCard key={project.title} project={project} index={i} isMobile={isMobile} />
          ))}
        </div>
      </div>
    </section>
  )
}

function ProjectCard({ project, index, isMobile }) {
  const { tag, title, url, desc, heroImg, foodImgs, sub, bg, accent } = project

  return (
    <div
      className={`fade-up d${index + 1}`}
      style={{
        background: '#faf9f7',
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: isMobile ? 16 : 20,
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)',
      }}
      onMouseEnter={e => { if (!isMobile) { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 50px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = 'rgba(200,169,126,0.25)' }}}
      onMouseLeave={e => { if (!isMobile) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)' }}}
    >
      {/* Top: Visit site banner + hero screenshot */}
      <a href={url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
        <div style={{ background: bg, padding: isMobile ? '16px 16px 0' : '24px 24px 0', position: 'relative' }}>
          {/* Visit site pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)',
            padding: '6px 14px 6px 10px', borderRadius: 100,
            fontSize: 12, fontWeight: 600, color: accent,
            marginBottom: isMobile ? 12 : 16,
            border: '1px solid rgba(0,0,0,0.06)',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Visit {title}
          </div>

          {/* Browser mockup with screenshot */}
          <div style={{
            background: 'white',
            borderRadius: '12px 12px 0 0',
            overflow: 'hidden',
            border: '1px solid rgba(0,0,0,0.08)',
            borderBottom: 'none',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
          }}>
            <div style={{ background: '#f0eeeb', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              {['#ff5f57','#febc2e','#28c840'].map(c => <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />)}
              <div style={{ flex: 1, textAlign: 'center', background: 'rgba(255,255,255,0.7)', borderRadius: 100, padding: '3px 12px', fontSize: 10, color: '#7a7888', maxWidth: 200, margin: '0 auto', border: '1px solid rgba(0,0,0,0.06)' }}>
                {url.replace('https://', '')}
              </div>
            </div>
            <img
              src={heroImg}
              alt={`${title} website screenshot`}
              loading="lazy"
              style={{ width: '100%', display: 'block', aspectRatio: '16/9', objectFit: 'cover', objectPosition: 'top' }}
            />
          </div>
        </div>
      </a>

      {/* Bottom: Info + food/brand images */}
      <div style={{ padding: isMobile ? '18px 16px 20px' : '24px 28px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-block', background: 'rgba(200,169,126,0.15)', color: '#b8906a', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 100 }}>{tag}</span>
          <span style={{ fontSize: 12, color: '#7a7888', fontWeight: 400 }}>{sub}</span>
        </div>
        <div style={{ fontSize: isMobile ? 18 : 20, fontWeight: 700, color: '#18181a', letterSpacing: '-0.4px', marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: isMobile ? 14 : 14, color: '#7a7888', lineHeight: 1.6, fontWeight: 300, marginBottom: 18, maxWidth: 600 }}>{desc}</div>

        {/* Food/brand image gallery */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: isMobile ? 8 : 10 }}>
          {foodImgs.map((img, i) => (
            <div key={i} style={{ borderRadius: isMobile ? 10 : 12, overflow: 'hidden', aspectRatio: '1', border: '1px solid rgba(0,0,0,0.06)' }}>
              <img
                src={img}
                alt={`${title} showcase ${i + 1}`}
                loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
          ))}
        </div>

        {/* CTA link */}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            marginTop: 18, fontSize: 14, fontWeight: 500,
            color: accent, textDecoration: 'none',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.7' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
        >
          View live site
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </div>
  )
}
