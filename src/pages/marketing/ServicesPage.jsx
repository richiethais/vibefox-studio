import SEOHead from '../../components/SEOHead'
import MarketingLayout from '../../components/marketing/MarketingLayout'
import Comparison from '../../components/Comparison'
import useIsMobile from '../../components/useIsMobile'
import { useFadeUp } from '../../components/useFadeUp'
import { Link } from 'react-router-dom'
import { getPublicRouteSeo, getServicesStructuredData } from '../../lib/publicSeo'

const serviceDetails = [
  {
    icon: 'landing',
    title: 'Landing Pages',
    gradient: 'linear-gradient(135deg, #f0ebff, #e2d8f8)',
    desc: 'High-converting single pages designed to capture leads and drive action. Built for speed, optimized for results, and ready to launch in days — not months.',
    includes: ['Custom design', 'Mobile-optimized layout', 'SEO-ready structure', 'Contact form with lead capture'],
    image: '/olympia-cafe-hero.webp',
    imageAlt: 'Olympia Cafe landing page built by VibeFox Studio',
  },
  {
    icon: 'website',
    title: 'Business Websites',
    gradient: 'linear-gradient(135deg, #ebf2ff, #d8e8ff)',
    desc: 'Multi-page sites that tell your story, build trust, and turn visitors into customers. Easy to update, impossible to outgrow.',
    includes: ['Up to 8 custom pages', 'CMS for content updates', 'Google Business integration', 'Analytics tracking'],
    image: null,
    imageAlt: null,
  },
  {
    icon: 'app',
    title: 'Custom Web Apps',
    gradient: 'linear-gradient(135deg, #fff5eb, #fae3cc)',
    desc: 'Booking systems, client portals, and dashboards with real logins, live data, and seamless workflows tailored to your operations.',
    includes: ['User authentication', 'Real-time database', 'Admin dashboard', 'API integrations'],
    image: '/service-crm.webp',
    imageAlt: 'VibeFox Studio CRM and invoicing dashboard',
  },
  {
    icon: 'seo',
    title: 'SEO & Content',
    gradient: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
    desc: 'Organic traffic that compounds over time. We handle keyword strategy, content creation, and ongoing optimization so you rank where it matters.',
    includes: ['Keyword research', 'Blog posts published', 'Search Console monitoring', 'Monthly reports'],
    image: '/service-seo-blog.webp',
    imageAlt: 'VibeFox Studio blog and SEO content platform',
  },
  {
    icon: 'security',
    title: 'Hosting & Security',
    gradient: 'linear-gradient(135deg, #fef2f2, #fecaca)',
    desc: 'Managed hosting with enterprise-grade security so your site stays fast, safe, and online. All handled for you.',
    includes: ['99.9% uptime', 'SSL included', 'Daily backups', 'Security monitoring'],
    image: '/service-hosting.webp',
    imageAlt: 'Server hosting and security infrastructure',
  },
  {
    icon: 'support',
    title: 'Ongoing Support',
    gradient: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
    desc: 'Quick updates, real communication, and a partner who actually cares about your growth. No tickets, no waiting.',
    includes: ['48-hour turnaround', 'Direct communication', 'Priority on growth plans', 'Quarterly reviews'],
    image: '/service-support.webp',
    imageAlt: 'Customer support and ongoing maintenance',
  },
]

function ServiceIcon({ iconKey }) {
  const common = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: '#b8906a', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }

  if (iconKey === 'landing') {
    return (
      <svg {...common}>
        <rect x="3" y="4" width="18" height="14" rx="2" />
        <path d="M3 9h18" />
        <circle cx="8" cy="6.5" r="0.7" fill="#b8906a" stroke="none" />
        <path d="M10 13c1.1-1.2 2.6-1.8 4-1.8 1.4 0 2.9.6 4 1.8" />
        <path d="M14 11.2v3.8" />
      </svg>
    )
  }

  if (iconKey === 'website') {
    return (
      <svg {...common}>
        <path d="M4 20V8l8-4 8 4v12" />
        <path d="M9 20v-6h6v6" />
        <path d="M8 10h.01M12 10h.01M16 10h.01" />
      </svg>
    )
  }

  if (iconKey === 'app') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="2.5" />
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.8 5.8l2.1 2.1M16.1 16.1l2.1 2.1M18.2 5.8l-2.1 2.1M7.9 16.1l-2.1 2.1" />
      </svg>
    )
  }

  if (iconKey === 'seo') {
    return (
      <svg {...common}>
        <path d="M4 19h16" />
        <path d="M7 15l3-3 3 2 4-5" />
        <path d="M17 9h3v3" />
      </svg>
    )
  }

  if (iconKey === 'security') {
    return (
      <svg {...common}>
        <path d="M12 3l7 3v6c0 5-3.5 8.5-7 9-3.5-.5-7-4-7-9V6l7-3z" />
        <path d="M9.5 12.5l2 2 3-3.5" />
      </svg>
    )
  }

  // support (default)
  return (
    <svg {...common}>
      <path d="M4 14v-1a8 8 0 0116 0v1" />
      <rect x="3" y="14" width="4" height="6" rx="1.5" />
      <rect x="17" y="14" width="4" height="6" rx="1.5" />
      <path d="M12 20v1" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#b8906a" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}

function ServiceSection({ service, index, isMobile }) {
  const ref = useFadeUp()
  const isOdd = index % 2 === 1
  const firstSentence = service.desc.split('. ')[0] + '.'

  const visualCard = (
    <div
      style={{
        background: service.gradient,
        borderRadius: 20,
        padding: service.image ? (isMobile ? '20px 16px' : '28px 24px') : (isMobile ? '48px 24px' : '64px 40px'),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: isMobile ? 200 : 280,
        order: isMobile ? 0 : (isOdd ? 1 : 0),
        overflow: 'hidden',
      }}
    >
      {service.image ? (
        <div style={{
          width: '100%',
          background: 'white',
          borderRadius: 12,
          overflow: 'hidden',
          border: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        }}>
          <div style={{ background: '#f0eeeb', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            {['#ff5f57','#febc2e','#28c840'].map(c => <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />)}
            <div style={{ flex: 1, textAlign: 'center', background: 'rgba(255,255,255,0.7)', borderRadius: 100, padding: '3px 12px', fontSize: 10, color: '#7a7888', maxWidth: 180, margin: '0 auto', border: '1px solid rgba(0,0,0,0.06)' }}>
              vibefoxstudio.com
            </div>
          </div>
          <img
            src={service.image}
            alt={service.imageAlt}
            loading="lazy"
            style={{ width: '100%', display: 'block', aspectRatio: '16/9', objectFit: 'cover', objectPosition: 'top' }}
          />
        </div>
      ) : (
        <div
          style={{
            background: '#fff',
            borderRadius: 100,
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          }}
        >
          <ServiceIcon iconKey={service.icon} />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#18181a', letterSpacing: '-0.2px' }}>{service.title}</span>
        </div>
      )}
    </div>
  )

  const contentColumn = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        order: isMobile ? 1 : (isOdd ? 0 : 1),
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#b8906a', marginBottom: 12 }}>
        {service.title}
      </div>
      <h3
        style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: isMobile ? 26 : 30,
          fontWeight: 400,
          color: '#18181a',
          letterSpacing: '-0.5px',
          lineHeight: 1.25,
          marginBottom: 16,
        }}
      >
        {firstSentence}
      </h3>
      <p style={{ fontSize: 15, color: '#3a3840', lineHeight: 1.65, fontWeight: 300, marginBottom: 28 }}>
        {service.desc}
      </p>
      <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#7a7888', marginBottom: 14 }}>
        What's included
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {service.includes.map(item => (
          <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14.5, color: '#3a3840', lineHeight: 1.5, fontWeight: 400 }}>
            <CheckIcon />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )

  return (
    <section
      ref={ref}
      style={{
        padding: isMobile ? '48px 20px' : '64px 40px',
      }}
    >
      <div
        style={{
          maxWidth: 1040,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? 24 : 48,
          alignItems: 'center',
        }}
      >
        {visualCard}
        {contentColumn}
      </div>
    </section>
  )
}

export default function ServicesPage() {
  const heroRef = useFadeUp()
  const isMobile = useIsMobile()
  const seo = getPublicRouteSeo('/services')
  const schema = getServicesStructuredData()

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

      {/* Hero */}
      <section
        ref={heroRef}
        style={{
          textAlign: 'center',
          padding: isMobile ? '128px 20px 64px' : '160px 40px 80px',
          maxWidth: 800,
          margin: '0 auto',
        }}
      >
        <div className="fade-up d1" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#b8906a', marginBottom: 16 }}>
          Services
        </div>
        <h1
          className="fade-up d2"
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: isMobile ? 'clamp(30px, 9vw, 44px)' : 48,
            fontWeight: 400,
            color: '#18181a',
            letterSpacing: '-1px',
            lineHeight: 1.15,
            marginBottom: 20,
          }}
        >
          Everything your business needs to{' '}
          <em style={{ fontStyle: 'italic', color: '#b8906a' }}>grow online.</em>
        </h1>
        <p
          className="fade-up d3"
          style={{
            fontSize: isMobile ? 15 : 17,
            color: '#7a7888',
            lineHeight: 1.6,
            fontWeight: 300,
            maxWidth: 520,
            margin: '0 auto 32px',
          }}
        >
          From landing pages to custom apps, SEO to ongoing support — we handle every layer of your digital presence so you can focus on running your business.
        </p>
        <Link
          to="/contact"
          className="fade-up d4"
          style={{
            display: 'inline-block',
            background: '#18181a',
            color: '#fff',
            fontSize: 14,
            fontWeight: 500,
            padding: '14px 32px',
            borderRadius: 10,
            textDecoration: 'none',
            letterSpacing: '-0.2px',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          Start a project →
        </Link>
      </section>

      {/* Service Sections */}
      {serviceDetails.map((service, i) => (
        <ServiceSection key={service.title} service={service} index={i} isMobile={isMobile} />
      ))}

      {/* Comparison */}
      <Comparison />

      {/* CTA Band */}
      <section style={{ padding: isMobile ? '48px 20px 80px' : '64px 40px 96px' }}>
        <div
          style={{
            maxWidth: 680,
            margin: '0 auto',
            background: '#faf9f7',
            border: '1px solid rgba(0,0,0,0.08)',
            borderRadius: 20,
            padding: isMobile ? '40px 24px' : '56px 48px',
            textAlign: 'center',
          }}
        >
          <h2
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: isMobile ? 28 : 34,
              fontWeight: 400,
              color: '#18181a',
              letterSpacing: '-0.5px',
              lineHeight: 1.2,
              marginBottom: 14,
            }}
          >
            Ready to get{' '}
            <em style={{ fontStyle: 'italic', color: '#b8906a' }}>started?</em>
          </h2>
          <p
            style={{
              fontSize: 15,
              color: '#7a7888',
              lineHeight: 1.6,
              fontWeight: 300,
              marginBottom: 28,
            }}
          >
            Tell us about your goals and we'll put together a plan that works for your business.
          </p>
          <Link
            to="/contact"
            style={{
              display: 'inline-block',
              background: '#18181a',
              color: '#fff',
              fontSize: 14,
              fontWeight: 500,
              padding: '14px 32px',
              borderRadius: 10,
              textDecoration: 'none',
              letterSpacing: '-0.2px',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Start a project →
          </Link>
        </div>
      </section>
    </MarketingLayout>
  )
}
