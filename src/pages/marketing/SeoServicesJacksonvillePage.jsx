import { Link } from 'react-router-dom'
import SEOHead from '../../components/SEOHead'
import MarketingLayout from '../../components/marketing/MarketingLayout'
import useIsMobile from '../../components/useIsMobile'
import { useFadeUp } from '../../components/useFadeUp'
import { getPublicRouteSeo, getSeoJaxSchema } from '../../lib/publicSeo'

// ─── Data ────────────────────────────────────────────────────────────────────

const seoPackages = [
  {
    title: 'Local SEO Starter',
    price: '$299/mo',
    desc: 'Get your Jacksonville business showing up in local searches. Ideal for businesses just starting their SEO journey.',
    includes: [
      'Google Business Profile optimization',
      'On-page keyword targeting',
      '2 blog posts per month',
      'Search Console monitoring',
      'Monthly ranking report',
    ],
  },
  {
    title: 'Growth SEO',
    price: '$499/mo',
    desc: 'Consistent content and deeper optimization for businesses ready to compete on page one for Jacksonville searches.',
    includes: [
      'Everything in Starter',
      '4 blog posts per month',
      'Local citation building',
      'Competitor gap analysis',
      'Quarterly strategy review',
    ],
    highlight: true,
  },
  {
    title: 'SEO + Web Design',
    price: 'Custom',
    desc: 'A new website built for SEO from the ground up, combined with an ongoing content and optimization strategy.',
    includes: [
      'Custom website build',
      'Full keyword strategy',
      'Monthly blog publishing',
      'Core Web Vitals tuning',
      'Direct builder access',
    ],
  },
]

const seoDeliverables = [
  { title: 'Google Business Profile', desc: 'Optimize your GBP listing so you appear in Jacksonville map results and local 3-pack.' },
  { title: 'Keyword Research', desc: 'We find exactly what Jacksonville customers search for and build your content around those terms.' },
  { title: 'On-Page Optimization', desc: 'Titles, meta descriptions, headings, and internal links structured to rank for local searches.' },
  { title: 'Monthly Blog Posts', desc: 'Consistent, locally-relevant content that builds authority and captures long-tail traffic.' },
  { title: 'Local Citations', desc: 'Accurate business listings across directories to strengthen local SEO signals.' },
  { title: 'Monthly Reporting', desc: 'Clear reports showing keyword rankings, traffic changes, and what we\'re doing next.' },
]

const faqs = [
  {
    q: 'How long does SEO take for Jacksonville businesses?',
    a: 'Most Jacksonville businesses start seeing measurable movement within 60–90 days. Competitive keywords typically take 3–6 months to reach page one. SEO is a long-term investment, but the results compound over time unlike paid ads.',
  },
  {
    q: 'What is local SEO and why does it matter in Jacksonville?',
    a: 'Local SEO helps your business appear when Jacksonville residents search for services near them — in Google Maps, the local 3-pack, and organic results. For any business serving the Jacksonville area, local SEO is the highest-ROI marketing channel.',
  },
  {
    q: 'Do I need a new website to benefit from SEO?',
    a: 'Not necessarily, but a slow or poorly structured website will limit your SEO results. We can audit your existing site and recommend whether an upgrade makes sense before starting an SEO plan.',
  },
  {
    q: 'How is Vibefox Studio different from other Jacksonville SEO companies?',
    a: 'We\'re a small, Jacksonville-based studio focused on local businesses. You work directly with the person doing the work — no account managers, no outsourcing. We only take clients we can genuinely help.',
  },
  {
    q: 'What Jacksonville neighborhoods and suburbs do you serve?',
    a: 'We work with businesses across the entire Jacksonville metro area including Riverside, Avondale, Southside, Jacksonville Beach, Neptune Beach, Atlantic Beach, Ponte Vedra, Mandarin, Fleming Island, and beyond.',
  },
]

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

function CheckIcon({ color = '#b8906a' }) {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}

function PackageCard({ pkg, isMobile }) {
  return (
    <div style={{
      background: pkg.highlight ? '#18181a' : '#faf9f7',
      border: pkg.highlight ? 'none' : '1px solid rgba(0,0,0,0.08)',
      borderRadius: 18,
      padding: isMobile ? '24px 20px' : '32px 28px',
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
    }}>
      {pkg.highlight && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: 'linear-gradient(90deg, #c8a97e, #b8906a)',
        }} />
      )}
      {pkg.highlight && (
        <div style={{
          position: 'absolute', top: 16, right: 16,
          background: 'rgba(200,169,126,0.15)', color: '#c8a97e',
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px',
          padding: '4px 10px', borderRadius: 100,
        }}>
          Most popular
        </div>
      )}
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', color: pkg.highlight ? '#c8a97e' : '#b8906a', marginBottom: 8 }}>
        {pkg.title}
      </div>
      <div style={{ fontSize: isMobile ? 24 : 28, fontWeight: 700, color: pkg.highlight ? 'white' : '#18181a', letterSpacing: '-0.5px', marginBottom: 4 }}>
        {pkg.price}
      </div>
      <p style={{ fontSize: 14, color: pkg.highlight ? 'rgba(255,255,255,0.45)' : '#7a7888', lineHeight: 1.6, fontWeight: 300, marginBottom: 20, marginTop: 8 }}>
        {pkg.desc}
      </p>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {pkg.includes.map(item => (
          <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 13.5, color: pkg.highlight ? 'rgba(255,255,255,0.7)' : '#3a3840', lineHeight: 1.4 }}>
            <CheckIcon color={pkg.highlight ? '#c8a97e' : '#b8906a'} />{item}
          </li>
        ))}
      </ul>
      <Link
        to="/contact"
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          marginTop: 24,
          background: pkg.highlight ? '#c8a97e' : '#18181a',
          color: pkg.highlight ? '#18181a' : '#fff',
          padding: '13px 24px', borderRadius: 100,
          fontSize: 13.5, fontWeight: 600, textDecoration: 'none',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)' }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none' }}
      >
        Get started →
      </Link>
    </div>
  )
}

function FaqItem({ q, a, isMobile }) {
  return (
    <div style={{ borderBottom: '1px solid rgba(0,0,0,0.07)', padding: isMobile ? '18px 0' : '22px 0' }}>
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

export default function SeoServicesJacksonvillePage() {
  const isMobile = useIsMobile()
  const heroRef = useFadeUp()
  const seo = getPublicRouteSeo('/seo-services-jacksonville-fl')
  const schema = getSeoJaxSchema()

  return (
    <MarketingLayout>
      <SEOHead
        title={seo.title}
        description={seo.description}
        path={seo.path}
        appendBrand={false}
        keywords={seo.keywords}
        structuredData={schema}
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
        {/* Trust bar — above the H1 */}
        <div className="fade-up d1" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          marginBottom: isMobile ? 24 : 28,
          fontSize: 13, color: '#7a7888',
          flexWrap: 'wrap', justifyContent: 'center',
        }}>
          <StarRating />
          <span style={{ fontWeight: 500, color: '#18181a' }}>5-star rated</span>
          <span style={{ color: 'rgba(0,0,0,0.2)' }}>·</span>
          <span>Jacksonville-based</span>
          <span style={{ color: 'rgba(0,0,0,0.2)' }}>·</span>
          <span>Transparent reporting</span>
        </div>

        {/* Keyword eyebrow */}
        <div className="fade-up d2" style={{
          fontSize: isMobile ? 13 : 14, fontWeight: 600,
          color: '#b8906a', letterSpacing: '0.2px',
          marginBottom: isMobile ? 14 : 16,
        }}>
          // Jacksonville SEO Company
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
            maxWidth: 780,
            margin: '0 auto',
          }}
        >
          Jacksonville SEO services that{' '}
          <em style={{ fontStyle: 'italic', color: '#b8906a' }}>put you on page one.</em>
        </h1>

        <p
          className="fade-up d4"
          style={{
            fontSize: isMobile ? 16 : 18,
            color: '#7a7888',
            lineHeight: 1.65,
            fontWeight: 300,
            maxWidth: 560,
            margin: isMobile ? '20px auto 32px' : '24px auto 40px',
          }}
        >
          Local SEO, content strategy, and Google Business optimization for Jacksonville, FL businesses that want organic traffic — without paying per click.
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
            Get a free SEO proposal →
          </Link>
          <Link
            to="/blogs"
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
            Read our SEO blog
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
          {[
            { stat: '3–6 mo', label: 'Typical time to page one' },
            { stat: '96', label: 'Average site SEO score' },
            { stat: '2×', label: 'Avg. traffic growth at 6 months' },
            { stat: '$0', label: 'Cost per click on organic traffic' },
          ].map((r, i) => (
            <div key={r.label} style={{
              textAlign: 'center',
              borderRight: (!isMobile && i < 3) ? '1px solid rgba(255,255,255,0.07)' : 'none',
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

      {/* ── What's Included ───────────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '64px 20px' : '96px 40px' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#b8906a', marginBottom: 12 }}>
            What's included
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
            Everything your Jacksonville business needs to{' '}
            <em style={{ fontStyle: 'italic', color: '#b8906a' }}>rank locally.</em>
          </h2>
          <p style={{ fontSize: 15, color: '#7a7888', lineHeight: 1.6, fontWeight: 300, maxWidth: 500, marginBottom: isMobile ? 32 : 52 }}>
            We handle every layer of local SEO so you show up when Jacksonville customers search for what you offer.
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: 14,
          }}>
            {seoDeliverables.map(item => (
              <div key={item.title} style={{
                background: '#faf9f7', border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 14, padding: isMobile ? '20px 18px' : '24px 22px',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'rgba(184,144,106,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 14,
                }}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#b8906a" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#18181a', marginBottom: 6, letterSpacing: '-0.2px' }}>
                  {item.title}
                </div>
                <div style={{ fontSize: 13.5, color: '#7a7888', lineHeight: 1.58, fontWeight: 300 }}>
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────────── */}
      <section style={{ background: '#faf9f7', padding: isMobile ? '64px 20px' : '96px 40px' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#b8906a', marginBottom: 12 }}>
            Pricing
          </div>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: isMobile ? 'clamp(26px, 8vw, 36px)' : 40,
            fontWeight: 400, color: '#18181a',
            letterSpacing: isMobile ? '-0.8px' : '-1px',
            lineHeight: 1.15,
            marginBottom: isMobile ? 8 : 12,
          }}>
            Transparent SEO pricing for{' '}
            <em style={{ fontStyle: 'italic', color: '#b8906a' }}>Jacksonville businesses.</em>
          </h2>
          <p style={{ fontSize: 15, color: '#7a7888', lineHeight: 1.6, fontWeight: 300, maxWidth: 480, marginBottom: isMobile ? 32 : 52 }}>
            No lock-in contracts. No mystery pricing. Cancel anytime.
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: 16, alignItems: 'start',
          }}>
            {seoPackages.map(pkg => (
              <PackageCard key={pkg.title} pkg={pkg} isMobile={isMobile} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Vibefox ───────────────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '64px 20px' : '96px 40px' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 64, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#b8906a', marginBottom: 12 }}>
              Why businesses choose us
            </div>
            <h2 style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: isMobile ? 'clamp(26px, 8vw, 34px)' : 38,
              fontWeight: 400, color: '#18181a',
              letterSpacing: '-0.8px', lineHeight: 1.2, marginBottom: 20,
            }}>
              A Jacksonville SEO company that{' '}
              <em style={{ fontStyle: 'italic', color: '#b8906a' }}>actually explains what they do.</em>
            </h2>
            <p style={{ fontSize: 15, color: '#7a7888', lineHeight: 1.7, fontWeight: 300, marginBottom: 20 }}>
              Most SEO agencies are black boxes. You pay, you wait, you hope. We do things differently — every month you get a plain-English report showing exactly what moved, what we published, and what's next.
            </p>
            <p style={{ fontSize: 15, color: '#7a7888', lineHeight: 1.7, fontWeight: 300, marginBottom: 32 }}>
              We're based in Jacksonville and we focus on Jacksonville businesses. We know which terms your local customers actually search, which competitors you're up against, and what it takes to outrank them.
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
              Get a free SEO audit →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              ['No black-box reporting', 'Clear monthly reports showing exactly what changed and why.'],
              ['Jacksonville-focused', 'We specialize in the local Jax market — not a national template.'],
              ['Content you own', 'All blog posts and copy we write belong to you, forever.'],
              ['Paired with web design', 'If your site needs to be faster or better structured, we can fix that too.'],
              ['No long-term contracts', 'Month-to-month plans. Stay because it\'s working, not because you\'re locked in.'],
              ['Direct access', 'Email or message the person doing your SEO — not a customer service rep.'],
            ].map(([title, desc]) => (
              <div key={title} style={{
                display: 'flex', gap: 14, alignItems: 'flex-start',
                background: '#faf9f7', border: '1px solid rgba(0,0,0,0.07)',
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
      <section style={{ background: '#faf9f7', padding: isMobile ? '64px 20px' : '80px 40px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <StarRating />
          </div>
          <blockquote style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: isMobile ? 18 : 22,
            color: '#18181a', lineHeight: 1.55,
            letterSpacing: '-0.3px', margin: '0 0 24px', fontStyle: 'normal',
          }}>
            "We went from having no online presence to getting new customers every week who found us through Google. The SEO work they did made a real, measurable difference."
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
            <em style={{ fontStyle: 'italic', color: '#b8906a' }}>Jacksonville SEO.</em>
          </h2>
          {faqs.map(faq => (
            <FaqItem key={faq.q} q={faq.q} a={faq.a} isMobile={isMobile} />
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section style={{ background: '#18181a', padding: isMobile ? '64px 20px' : '96px 40px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#c8a97e', marginBottom: 16 }}>
            Ready to rank?
          </div>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: isMobile ? 'clamp(28px, 9vw, 38px)' : 42,
            fontWeight: 400, color: 'white',
            letterSpacing: '-1px', lineHeight: 1.15, marginBottom: 16,
          }}>
            Get a free Jacksonville SEO{' '}
            <em style={{ fontStyle: 'italic', color: '#c8a97e' }}>proposal today.</em>
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65, fontWeight: 300, marginBottom: 32 }}>
            We'll audit your current rankings, identify your biggest opportunities, and show you exactly what an SEO plan for your business would look like.
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
            Get my free SEO proposal →
          </Link>
          <div style={{ marginTop: 20, fontSize: 13, color: 'rgba(255,255,255,0.25)', fontWeight: 300 }}>
            Typically respond within 24 hours · Jacksonville, FL
          </div>
        </div>
      </section>
    </MarketingLayout>
  )
}
