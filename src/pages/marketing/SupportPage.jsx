import { useState } from 'react'
import { Link } from 'react-router-dom'
import MarketingLayout from '../../components/marketing/MarketingLayout'
import SEOHead from '../../components/SEOHead'
import useIsMobile from '../../components/useIsMobile'
import { getPublicRouteSeo, getSupportFaqStructuredData } from '../../lib/publicSeo'
import { supportFaqs } from '../../content/faqs'

const SUPPORT_EMAIL = 'inquiries@vibefoxstudio.com'

const helpTopics = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b8906a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="2" x2="12" y2="22" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    title: 'Billing & payments',
    description: 'Questions about an invoice, payment link, or receipt? Payments are processed securely through Stripe, and receipts are emailed automatically.',
    cta: { label: `Email ${SUPPORT_EMAIL}`, href: `mailto:${SUPPORT_EMAIL}?subject=Billing%20question` },
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b8906a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    title: 'Client portal',
    description: 'Existing clients can track projects, pay invoices, message us, and submit requests from the client portal.',
    cta: { label: 'Log in to the portal', to: '/login' },
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b8906a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
    title: 'Website changes',
    description: "Need something updated on your site? Send a request through the portal's Support tab, or email us with the details and we'll take care of it.",
    cta: { label: 'Submit a request', to: '/login' },
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b8906a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: 'New projects',
    description: "Not a client yet? Tell us about your project and we'll reply with next steps, timeline guidance, and a clear quote.",
    cta: { label: 'Start a conversation', to: '/contact' },
  },
]

export default function SupportPage() {
  const isMobile = useIsMobile()
  const seo = getPublicRouteSeo('/support')
  const [openFaq, setOpenFaq] = useState(null)
  const faqSchema = getSupportFaqStructuredData()

  return (
    <MarketingLayout hideCTA>
      <SEOHead
        title={seo.title}
        description={seo.description}
        path={seo.path}
        appendBrand={false}
        keywords={seo.keywords}
        structuredData={faqSchema}
      />

      <section style={{ padding: isMobile ? '128px 18px 72px' : '160px 40px 96px', maxWidth: 1100, margin: '0 auto' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 48 : 64 }}>
          <p className="anim-rise-1" style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5, color: '#b8906a', marginBottom: 12 }}>
            Support
          </p>
          <h1 className="anim-rise-2" style={{ fontSize: isMobile ? 32 : 48, fontWeight: 700, margin: '0 0 16px', lineHeight: 1.15 }}>
            How can we <em style={{ fontStyle: 'italic', color: '#b8906a' }}>help?</em>
          </h1>
          <p className="anim-rise-3" style={{ fontSize: isMobile ? 15 : 17, color: '#666', maxWidth: 520, margin: '0 auto' }}>
            Billing questions, website changes, portal access, or anything else — pick a topic below or email us directly and we'll respond within 1 business day.
          </p>
        </div>

        {/* Help topic cards */}
        <div
          className="anim-rise-4"
          style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14, marginBottom: isMobile ? 48 : 64 }}
        >
          {helpTopics.map(topic => (
            <div
              key={topic.title}
              style={{
                background: '#faf9f7',
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 14,
                padding: '22px 24px',
                display: 'flex',
                gap: 16,
                alignItems: 'flex-start',
              }}
            >
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(200,169,126,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {topic.icon}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{topic.title}</div>
                <div style={{ fontSize: 13.5, color: '#666', lineHeight: 1.55, marginBottom: 10 }}>{topic.description}</div>
                {topic.cta.to ? (
                  <Link to={topic.cta.to} style={{ fontSize: 13, fontWeight: 600, color: '#8f6844', textDecoration: 'none' }}>
                    {topic.cta.label} →
                  </Link>
                ) : (
                  <a href={topic.cta.href} style={{ fontSize: 13, fontWeight: 600, color: '#8f6844', textDecoration: 'none', overflowWrap: 'anywhere' }}>
                    {topic.cta.label} →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Support FAQ */}
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 700, margin: '0 0 8px', textAlign: 'center' }}>
            Common questions
          </h2>
          <p style={{ fontSize: 14, color: '#666', textAlign: 'center', margin: '0 0 28px' }}>
            Quick answers to the things clients ask most.
          </p>
          <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }}>
            {supportFaqs.map((faq, i) => (
              <div key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                <button
                  aria-expanded={openFaq === i}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
                    padding: isMobile ? '16px 0' : '18px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20,
                    fontSize: isMobile ? 14 : 15, fontWeight: 500, color: openFaq === i ? '#b8906a' : '#18181a',
                    fontFamily: 'inherit', letterSpacing: '-0.2px', transition: 'color 0.18s',
                  }}
                >
                  {faq.q}
                  <span style={{
                    width: 28, height: 28, borderRadius: '50%',
                    border: '1px solid rgba(0,0,0,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 17, color: openFaq === i ? 'white' : '#7a7888', flexShrink: 0,
                    background: openFaq === i ? '#18181a' : '#f5f3f0',
                    transform: openFaq === i ? 'rotate(45deg)' : 'none',
                    transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)',
                  }}>+</span>
                </button>
                {openFaq === i && (
                  <p style={{ padding: '0 0 18px', fontSize: 14, color: '#7a7888', lineHeight: 1.65, margin: 0, maxWidth: 600 }}>
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Direct contact */}
        <div style={{ textAlign: 'center', marginTop: isMobile ? 48 : 64, background: '#faf9f7', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16, padding: isMobile ? '32px 20px' : '40px 32px' }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Still need a hand?</div>
          <p style={{ fontSize: 14, color: '#666', margin: '0 0 18px', lineHeight: 1.6 }}>
            Email us anything — a screenshot helps if something looks broken. We reply within 1 business day.
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            style={{
              display: 'inline-block', background: '#18181a', color: 'white',
              padding: '13px 26px', borderRadius: 100, fontSize: 14, fontWeight: 500, textDecoration: 'none',
            }}
          >
            {SUPPORT_EMAIL}
          </a>
        </div>
      </section>
    </MarketingLayout>
  )
}
