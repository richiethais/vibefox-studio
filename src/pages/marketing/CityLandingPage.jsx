import { useParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import SEOHead from '../../components/SEOHead'
import MarketingLayout from '../../components/marketing/MarketingLayout'
import useIsMobile from '../../components/useIsMobile'
import { useFadeUp } from '../../components/useFadeUp'
import { getCityBySlug } from '../../data/cities'
import { SITE_URL, DEFAULT_DISPLAY_NAME, mergeKeywords } from '../../lib/publicSeo'

// ─── Data ────────────────────────────────────────────────────────────────────

const stats = [
  { stat: '100+', label: 'Client Reviews' },
  { stat: '5.0', label: 'Average Rating' },
  { stat: '1–2 wk', label: 'Typical Delivery' },
  { stat: '100%', label: 'Custom Built' },
]

const services = [
  {
    title: 'Web Design',
    desc: 'Custom websites built to convert visitors into customers.',
    includes: ['Custom responsive design', 'Mobile-optimized', 'SEO-ready structure', 'Lead capture forms', 'Fast CDN hosting'],
  },
  {
    title: 'SEO & Local Search',
    descTemplate: (city) => `Rank higher on Google in ${city} searches.`,
    includes: ['Google Business optimization', 'Local keyword targeting', 'On-page SEO', 'Monthly reporting', 'Content strategy'],
  },
  {
    title: 'Meta Ads & PPC',
    desc: 'Targeted ad campaigns that drive real leads.',
    includes: ['Facebook & Instagram ads', 'Google Ads management', 'Audience targeting', 'A/B testing', 'ROI tracking'],
  },
  {
    title: 'Content & Strategy',
    desc: 'Blog posts, social content, and growth strategy.',
    includes: ['Monthly blog posts', 'Social media content', 'Email campaigns', 'Brand strategy', 'Analytics & insights'],
  },
]

function buildFaqs(city) {
  return [
    {
      q: `How much does digital marketing cost in ${city.name}, ${city.state}?`,
      a: `Digital marketing costs vary depending on the scope of your project. We offer custom proposals tailored to your ${city.name} business goals — whether you need a new website, SEO, ad campaigns, or a full-service growth plan. Reach out for a free, no-obligation quote.`,
    },
    {
      q: 'How long does it take to build a website?',
      a: 'Most websites are delivered in 1–2 weeks. Landing pages can launch in as few as 5 business days. We move fast without cutting corners.',
    },
    {
      q: `Will my ${city.name} business rank on Google?`,
      a: `Yes. Every site we build includes on-page SEO, fast load times, proper heading structure, and local SEO signals to help your business appear in ${city.name} searches.`,
    },
    {
      q: `Do you work with small businesses in ${city.name}?`,
      a: `Absolutely. Most of our clients are local businesses — restaurants, service providers, contractors, and professional services in ${city.name} neighborhoods like ${city.neighborhoods.slice(0, 3).join(', ')}, and beyond.`,
    },
    {
      q: 'What happens after the website launches?',
      a: 'We offer ongoing Growth Plans that include hosting, security, monthly blog posts, SEO monitoring, and unlimited small updates to keep your site ranking higher every month.',
    },
  ]
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StarRating() {
  return (
    <div style={{ display: 'inline-flex', gap: 3 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize: 14, color: '#f59e0b' }}>★</span>
      ))}
    </div>
  )
}

function CheckIcon() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#b8906a" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}

function ServiceCard({ service, cityName, isMobile }) {
  const desc = service.descTemplate ? service.descTemplate(cityName) : service.desc
  return (
    <div style={{
      background: '#faf9f7',
      border: '1px solid rgba(0,0,0,0.08)',
      borderRadius: 18,
      padding: isMobile ? '24px 20px' : '32px 28px',
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#b8906a', marginBottom: 8 }}>
        {service.title}
      </div>
      <p style={{ fontSize: 14, color: '#7a7888', lineHeight: 1.6, fontWeight: 300, marginBottom: 20, marginTop: 8 }}>
        {desc}
      </p>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
        {service.includes.map(item => (
          <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 13.5, color: '#3a3840', lineHeight: 1.4 }}>
            <CheckIcon />{item}
          </li>
        ))}
      </ul>
      <Link
        to="/contact"
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          marginTop: 24, background: '#18181a', color: '#fff',
          padding: '13px 24px', borderRadius: 100,
          fontSize: 13.5, fontWeight: 500, textDecoration: 'none',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#2a2830'; e.currentTarget.style.transform = 'translateY(-1px)' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#18181a'; e.currentTarget.style.transform = 'none' }}
      >
        Get a free proposal →
      </Link>
    </div>
  )
}

function FaqItem({ q, a, isMobile }) {
  return (
    <div style={{
      borderBottom: '1px solid rgba(0,0,0,0.07)',
      padding: isMobile ? '18px 0' : '22px 0',
    }}>
      <div style={{ fontSize: isMobile ? 15 : 16, fontWeight: 600, color: '#18181a', letterSpacing: '-0.2px', marginBottom: 10 }}>
        {q}
      </div>
      <p style={{ fontSize: 14, color: '#7a7888', lineHeight: 1.65, fontWeight: 300, margin: 0 }}>
        {a}
      </p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CityLandingPage() {
  const { citySlug } = useParams()
  const isMobile = useIsMobile()
  const heroRef = useFadeUp()

  // Strip the "-digital-marketing-agency" suffix to get the city slug
  const slug = citySlug ? citySlug.replace(/-digital-marketing-agency$/, '') : ''
  const city = getCityBySlug(slug)

  if (!city) {
    return (
      <MarketingLayout hideCTA>
        <div style={{ padding: '160px 20px 120px', textAlign: 'center' }}>
          <h1 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 36,
            fontWeight: 400,
            color: '#18181a',
            marginBottom: 16,
          }}>
            Page not found
          </h1>
          <p style={{ fontSize: 16, color: '#7a7888', fontWeight: 300, marginBottom: 32 }}>
            We couldn't find the page you're looking for.
          </p>
          <Link
            to="/"
            style={{
              display: 'inline-flex', alignItems: 'center',
              background: '#18181a', color: '#fff',
              padding: '14px 28px', borderRadius: 100,
              fontSize: 14, fontWeight: 500, textDecoration: 'none',
            }}
          >
            Back to home →
          </Link>
        </div>
      </MarketingLayout>
    )
  }

  const faqs = buildFaqs(city)
  const path = `/${city.slug}-digital-marketing-agency`
  const seoTitle = `${city.name} Digital Marketing Agency | Vibefox Studio`
  const seoDescription = city.description
  const seoKeywords = mergeKeywords(
    `digital marketing agency ${city.name.toLowerCase()}, ${city.name.toLowerCase()} web design, seo services ${city.name.toLowerCase()} ${city.state.toLowerCase()}, ${city.name.toLowerCase()} digital marketing, web design ${city.name.toLowerCase()} ${city.state.toLowerCase()}, ${city.name.toLowerCase()} seo company, local seo ${city.name.toLowerCase()}`
  )

  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: `Digital Marketing Agency ${city.name} ${city.state}`,
      serviceType: 'Digital Marketing',
      provider: { '@type': 'LocalBusiness', name: 'Vibefox Studio', url: SITE_URL },
      areaServed: { '@type': 'City', name: city.name, containedInPlace: { '@type': 'State', name: city.stateFullName } },
      url: `${SITE_URL}${path}`,
      description: seoDescription,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(f => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ]

  return (
    <MarketingLayout hideCTA>
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        path={path}
        appendBrand={false}
        keywords={seoKeywords}
        structuredData={structuredData}
      />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        style={{
          background: `
            radial-gradient(55% 45% at 50% 0%, rgba(200,169,126,0.15) 0%, transparent 100%),
            #f5f3f0
          `,
          padding: isMobile ? '128px 20px 64px' : '160px 40px 80px',
          textAlign: 'center',
        }}
      >
        {/* Trust bar */}
        <div className="fade-up d1" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          marginBottom: isMobile ? 24 : 28,
          fontSize: 13, color: '#7a7888',
          flexWrap: 'wrap', justifyContent: 'center',
        }}>
          <StarRating />
          <span style={{ fontWeight: 500, color: '#18181a' }}>100+ Client Reviews</span>
        </div>

        {/* Eyebrow */}
        <div className="fade-up d2" style={{
          fontSize: isMobile ? 13 : 14, fontWeight: 600,
          color: '#b8906a', letterSpacing: '0.2px',
          marginBottom: isMobile ? 14 : 16,
        }}>
          // {city.name} Digital Marketing Agency
        </div>

        <h1
          className="fade-up d3"
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: isMobile ? 'clamp(32px, 10vw, 48px)' : 'clamp(48px, 6vw, 64px)',
            fontWeight: 400,
            color: '#18181a',
            letterSpacing: isMobile ? '-1px' : '-1.5px',
            lineHeight: 1.1,
            maxWidth: 760,
            margin: '0 auto',
          }}
        >
          {city.name} Digital Marketing{' '}
          <em style={{ fontStyle: 'italic', color: '#b8906a' }}>Agency</em>
        </h1>

        <p
          className="fade-up d4"
          style={{
            fontSize: isMobile ? 16 : 18,
            color: '#7a7888',
            lineHeight: 1.65,
            fontWeight: 300,
            maxWidth: 540,
            margin: isMobile ? '20px auto 32px' : '24px auto 40px',
          }}
        >
          {city.description}
        </p>

        <div className="fade-up d5" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            to="/contact"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#18181a', color: '#fff',
              padding: isMobile ? '15px 28px' : '16px 32px',
              borderRadius: 100, fontSize: 15, fontWeight: 500,
              textDecoration: 'none', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#2a2830'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#18181a'; e.currentTarget.style.transform = 'none' }}
          >
            Get Your Free Proposal →
          </Link>
          <Link
            to="/work"
            style={{
              display: 'inline-flex', alignItems: 'center',
              background: 'rgba(250,249,247,0.8)', color: '#3a3840',
              padding: isMobile ? '15px 24px' : '16px 28px',
              borderRadius: 100, fontSize: 15, fontWeight: 400,
              textDecoration: 'none',
              border: '1px solid rgba(0,0,0,0.08)', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#edeae5' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(250,249,247,0.8)' }}
          >
            View Our Work
          </Link>
        </div>
      </section>

      {/* ── Stats Bar ────────────────────────────────────────────────────── */}
      <section style={{ background: '#18181a', padding: isMobile ? '32px 24px' : '40px 40px' }}>
        <div style={{
          maxWidth: 1040, margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: isMobile ? 20 : 0,
        }}>
          {stats.map((r, i) => (
            <div key={r.label} style={{
              textAlign: 'center',
              borderRight: (!isMobile && i < stats.length - 1) ? '1px solid rgba(255,255,255,0.07)' : 'none',
              padding: isMobile ? '0' : '0 24px',
            }}>
              <div style={{ fontSize: isMobile ? 28 : 34, fontWeight: 700, color: '#c8a97e', letterSpacing: '-1px', lineHeight: 1 }}>
                {r.stat}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 6, fontWeight: 300 }}>
                {r.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Services Overview ─────────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '64px 20px' : '96px 40px' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#b8906a', marginBottom: 12 }}>
            What we do
          </div>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: isMobile ? 'clamp(26px, 8vw, 36px)' : 40,
            fontWeight: 400, color: '#18181a',
            letterSpacing: isMobile ? '-0.8px' : '-1px',
            lineHeight: 1.15,
            maxWidth: 600,
            marginBottom: isMobile ? 12 : 16,
          }}>
            {city.name} digital marketing for every stage of{' '}
            <em style={{ fontStyle: 'italic', color: '#b8906a' }}>your business.</em>
          </h2>
          <p style={{ fontSize: 15, color: '#7a7888', lineHeight: 1.6, fontWeight: 300, maxWidth: 480, marginBottom: isMobile ? 32 : 52 }}>
            Web design, SEO, paid ads, and content strategy — all built to grow your {city.name} business.
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: 16,
          }}>
            {services.map(service => (
              <ServiceCard key={service.title} service={service} cityName={city.name} isMobile={isMobile} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Vibefox ───────────────────────────────────────────────────── */}
      <section style={{ background: '#faf9f7', padding: isMobile ? '64px 20px' : '96px 40px' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 64, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#b8906a', marginBottom: 12 }}>
              Why {city.name} businesses choose us
            </div>
            <h2 style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: isMobile ? 'clamp(26px, 8vw, 34px)' : 38,
              fontWeight: 400, color: '#18181a',
              letterSpacing: '-0.8px', lineHeight: 1.2,
              marginBottom: 20,
            }}>
              Built by people who understand{' '}
              <em style={{ fontStyle: 'italic', color: '#b8906a' }}>{city.name}'s market.</em>
            </h2>
            <p style={{ fontSize: 15, color: '#7a7888', lineHeight: 1.7, fontWeight: 300, marginBottom: 28 }}>
              We're a digital marketing studio focused entirely on helping local businesses grow. We understand the {city.name} market and what it takes to stand out — whether you're in {city.neighborhoods.join(', ')}, or anywhere nearby.
            </p>
            <p style={{ fontSize: 15, color: '#7a7888', lineHeight: 1.7, fontWeight: 300, marginBottom: 32 }}>
              Every site we build is fast, mobile-first, and optimized for local search from day one. No bloated page builders, no offshore handoffs — just clean, custom work delivered on time.
            </p>
            <Link
              to="/contact"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#18181a', color: '#fff',
                padding: '14px 28px', borderRadius: 100,
                fontSize: 14, fontWeight: 500, textDecoration: 'none',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#2a2830' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#18181a' }}
            >
              Start a project →
            </Link>
          </div>

          {/* Feature checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              ['Direct & Local', 'You talk to the people building your site — not an account manager.'],
              ['SEO built in from day one', 'Every build includes on-page optimization and local SEO structure.'],
              ['Fast delivery', 'Most projects launch in 1–2 weeks, not months.'],
              ['Flat-rate pricing', 'No hourly billing, no surprise invoices. One price, full project.'],
              ['Ongoing Growth Plans', 'Monthly SEO, blog posts, updates, and monitoring for continued growth.'],
              ['Full-service marketing', 'Web design, SEO, ads, and content — all under one roof.'],
            ].map(([title, desc]) => (
              <div key={title} style={{
                display: 'flex', gap: 14, alignItems: 'flex-start',
                background: 'white', border: '1px solid rgba(0,0,0,0.07)',
                borderRadius: 12, padding: '16px 18px',
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'rgba(184,144,106,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginTop: 1,
                }}>
                  <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#b8906a" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#18181a', marginBottom: 2 }}>{title}</div>
                  <div style={{ fontSize: 13, color: '#7a7888', fontWeight: 300, lineHeight: 1.5 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonial ───────────────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '64px 20px' : '80px 40px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <StarRating />
          </div>
          <blockquote style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: isMobile ? 18 : 22,
            color: '#18181a', lineHeight: 1.55,
            letterSpacing: '-0.3px',
            margin: '0 0 24px',
            fontStyle: 'normal',
          }}>
            "Vibefox Studio built us a beautiful website that really captures the feel of our restaurant. We went from having no online presence to getting new customers every week who found us through Google."
          </blockquote>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(200,169,126,0.3)', flexShrink: 0 }}>
              <img src="/olympia-cafe-hero.webp" alt="Olympia Cafe" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#18181a' }}>Olympia Cafe</div>
              <div style={{ fontSize: 13, color: '#7a7888', fontWeight: 300 }}>Greek Restaurant · Jacksonville, FL</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Process ───────────────────────────────────────────────────────── */}
      <section style={{ background: '#faf9f7', padding: isMobile ? '64px 20px' : '96px 40px' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#b8906a', marginBottom: 12 }}>
            How it works
          </div>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: isMobile ? 'clamp(26px, 8vw, 34px)' : 38,
            fontWeight: 400, color: '#18181a',
            letterSpacing: '-0.8px', lineHeight: 1.2,
            marginBottom: isMobile ? 32 : 48,
          }}>
            Your {city.name} digital marketing, live in{' '}
            <em style={{ fontStyle: 'italic', color: '#b8906a' }}>1–2 weeks.</em>
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: 14,
          }}>
            {[
              { num: '01', title: 'Discovery call', desc: '30 minutes. We talk through your goals, target customers, and what you need. No obligation.' },
              { num: '02', title: 'We design & build', desc: 'First draft in 5–7 days. Two revision rounds included. Built with local SEO baked in from the start.' },
              { num: '03', title: 'Launch & grow', desc: 'We handle launch, hosting, and SSL. Optional Growth Plan keeps your business ranking higher every month.' },
            ].map(step => (
              <div key={step.num} style={{
                background: 'white', border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 16, padding: isMobile ? '22px 20px' : '28px 26px',
              }}>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: '#c8a97e', lineHeight: 1, marginBottom: 14 }}>
                  {step.num}
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#18181a', marginBottom: 8, letterSpacing: '-0.2px' }}>
                  {step.title}
                </div>
                <div style={{ fontSize: 14, color: '#7a7888', lineHeight: 1.6, fontWeight: 300 }}>
                  {step.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '64px 20px' : '96px 40px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#b8906a', marginBottom: 12 }}>
            FAQ
          </div>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: isMobile ? 'clamp(26px, 8vw, 34px)' : 38,
            fontWeight: 400, color: '#18181a',
            letterSpacing: '-0.8px', lineHeight: 1.2,
            marginBottom: isMobile ? 28 : 40,
          }}>
            Common questions about{' '}
            <em style={{ fontStyle: 'italic', color: '#b8906a' }}>{city.name} digital marketing.</em>
          </h2>
          <div>
            {faqs.map(faq => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} isMobile={isMobile} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section style={{ background: '#18181a', padding: isMobile ? '64px 20px' : '96px 40px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#c8a97e', marginBottom: 16 }}>
            Ready to get started?
          </div>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: isMobile ? 'clamp(28px, 9vw, 38px)' : 42,
            fontWeight: 400, color: 'white',
            letterSpacing: '-1px', lineHeight: 1.15,
            marginBottom: 16,
          }}>
            Get a free {city.name} digital marketing{' '}
            <em style={{ fontStyle: 'italic', color: '#c8a97e' }}>proposal today.</em>
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65, fontWeight: 300, marginBottom: 32 }}>
            Tell us about your business and we'll put together a custom plan. No commitment, no sales pressure — just a clear look at what's possible.
          </p>
          <Link
            to="/contact"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#c8a97e', color: '#18181a',
              padding: '16px 36px', borderRadius: 100,
              fontSize: 15, fontWeight: 600, textDecoration: 'none',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#d4b68c'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#c8a97e'; e.currentTarget.style.transform = 'none' }}
          >
            Get my free proposal →
          </Link>
          <div style={{ marginTop: 20, fontSize: 13, color: 'rgba(255,255,255,0.25)', fontWeight: 300 }}>
            Typically respond within 24 hours
          </div>
        </div>
      </section>
    </MarketingLayout>
  )
}
