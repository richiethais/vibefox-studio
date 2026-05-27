import { Link, Navigate, useParams } from 'react-router-dom'
import MarketingLayout from '../../components/marketing/MarketingLayout'
import SEOHead from '../../components/SEOHead'
import useIsMobile from '../../components/useIsMobile'
import { getPublicRouteSeo } from '../../lib/publicSeo'

const UPDATED_AT = 'May 27, 2026'
const BUSINESS_EMAIL = 'inquiries@vibefoxstudio.com'

const LEGAL_PAGES = {
  'privacy-policy': {
    label: 'Privacy Policy',
    intro:
      'This Privacy Policy explains how Vibefox Studio collects, uses, shares, and protects information when people visit our website, submit forms, use client/admin portals, request support, or purchase coaching and related services.',
    sections: [
      {
        heading: 'Information we collect',
        body: [
          'Contact details such as name, email address, phone number, company, budget range, service interest, and message content when you submit an inquiry or coaching request.',
          'Account and client portal information, including login details handled through Supabase authentication, project details, support requests, messages, invoice status, and related client records.',
          'Payment and checkout information handled by Stripe or other payment processors. We do not intentionally store full card numbers on our website.',
          'Technical information such as device/browser details, IP address, pages visited, timestamps, referral source, and security logs that may be collected by hosting, database, authentication, or infrastructure providers.',
          'Optional communications you send to us by email, forms, client messages, or support requests.',
        ],
      },
      {
        heading: 'How we use information',
        body: [
          'To respond to inquiries, prepare project recommendations, deliver services, manage client projects, process payments, send invoices, and provide support.',
          'To operate and secure the website, client portal, admin tools, authentication, database records, forms, and service workflows.',
          'To send service-related messages such as confirmations, project updates, invoices, support responses, and administrative notices.',
          'To improve our services, website performance, content, and customer experience.',
          'To comply with legal, tax, accounting, security, fraud prevention, and contract obligations.',
        ],
      },
      {
        heading: 'How we share information',
        body: [
          'We share information with service providers that help us run the business, including hosting, Supabase, Stripe/payment processors, email, scheduling, analytics or security providers, and professional advisors.',
          'We may share information when required by law, to protect rights and safety, to enforce agreements, or in connection with a business transfer such as a merger, acquisition, or asset sale.',
          'We do not sell personal information in the traditional sense. If advertising or analytics tools are added later in a way that qualifies as selling or sharing under privacy laws, this policy should be updated and appropriate opt-out tools should be added.',
        ],
      },
      {
        heading: 'Cookies, storage, and authentication',
        body: [
          'The website may use cookies, local storage, session storage, or similar technologies for essential functions such as remembering authentication sessions, preserving login preferences, securing accounts, and keeping the site usable.',
          'If non-essential analytics, advertising, or tracking tools are added later, visitors should be given any required notice, preference controls, and opt-out options.',
        ],
      },
      {
        heading: 'Your privacy choices',
        body: [
          `You may contact us at ${BUSINESS_EMAIL} to request access, correction, deletion, or a copy of personal information you provided to us, subject to identity verification and legal exceptions.`,
          'You can unsubscribe from marketing emails by using any unsubscribe link provided or by contacting us. Service and transactional messages may still be sent when needed to provide services or administer an account.',
          'Browser settings may allow you to block cookies or clear local storage, but some account or portal features may stop working correctly.',
        ],
      },
      {
        heading: 'California, Florida, and other U.S. privacy rights',
        body: [
          'Some state privacy laws provide rights to know, access, correct, delete, obtain a copy of, or opt out of certain uses of personal information. Whether a particular law applies can depend on revenue, data volume, business model, and other thresholds.',
          'If you believe you have rights under a state privacy law, contact us using the email below and describe the request. We will review and respond as required by applicable law.',
        ],
      },
      {
        heading: 'Data retention and security',
        body: [
          'We keep information for as long as reasonably necessary for the purposes described above, including providing services, maintaining records, resolving disputes, enforcing agreements, and meeting legal obligations.',
          'We use reasonable administrative, technical, and organizational safeguards, but no website, database, email system, or internet transmission can be guaranteed to be completely secure.',
        ],
      },
      {
        heading: 'Children',
        body: [
          'Our website and services are intended for business users and are not directed to children under 13. We do not knowingly collect personal information from children under 13.',
        ],
      },
      {
        heading: 'Changes to this policy',
        body: [
          'We may update this Privacy Policy from time to time. The updated version will be posted on this page with a new effective date.',
        ],
      },
    ],
  },
  'terms-of-service': {
    label: 'Terms of Service',
    intro:
      'These Terms of Service govern use of the Vibefox Studio website, client portal, inquiry forms, invoices, coaching checkout, and related digital services.',
    sections: [
      {
        heading: 'Acceptance of terms',
        body: [
          'By using this website, submitting an inquiry, accessing a client portal, paying an invoice, or purchasing a service, you agree to these Terms. If you do not agree, do not use the website or services.',
        ],
      },
      {
        heading: 'Services and proposals',
        body: [
          'Website, SEO, development, support, and coaching services are provided under the scope, timeline, deliverables, fees, and payment terms stated in the relevant proposal, invoice, checkout page, statement of work, or written agreement.',
          'Marketing, SEO, conversion, revenue, traffic, ranking, and business outcomes can vary. We do not guarantee specific rankings, sales, leads, revenue, or platform approvals unless expressly stated in a signed written agreement.',
        ],
      },
      {
        heading: 'Client responsibilities',
        body: [
          'You are responsible for providing accurate information, timely feedback, content, brand assets, approvals, and lawful materials needed to complete the work.',
          'You must have the rights to any logos, images, copy, data, account access, and other materials you provide to us.',
          'You are responsible for reviewing deliverables, legal claims, industry-specific compliance requirements, advertising claims, privacy obligations, and final published content.',
        ],
      },
      {
        heading: 'Payments, invoices, and taxes',
        body: [
          'Fees are due as stated on the applicable invoice, checkout page, proposal, subscription, or written agreement.',
          'Late, failed, disputed, or reversed payments may pause work, delay delivery, restrict portal access, or result in additional collection costs where allowed by law.',
          'Prices may not include taxes, platform fees, third-party subscriptions, hosting, stock assets, fonts, plugins, or advertising spend unless explicitly stated.',
        ],
      },
      {
        heading: 'Intellectual property',
        body: [
          'Unless a written agreement says otherwise, final custom deliverables created specifically for you transfer to you after all related invoices are paid in full.',
          'We retain ownership of pre-existing tools, reusable code, templates, processes, know-how, strategy frameworks, and internal systems. We may grant you a license to use them as part of your deliverables.',
          'We may display non-confidential completed work in portfolios, case studies, marketing materials, and social posts unless we agree in writing not to.',
        ],
      },
      {
        heading: 'Third-party services',
        body: [
          'The website and services may depend on third-party platforms such as Supabase, Stripe, hosting providers, email tools, CMS systems, scheduling tools, analytics, search engines, social networks, or advertising platforms.',
          'We are not responsible for third-party outages, policy changes, account suspensions, price changes, data handling, security incidents, or platform decisions outside our control.',
        ],
      },
      {
        heading: 'Acceptable use',
        body: [
          'You may not misuse the website or portal, attempt unauthorized access, interfere with security, upload malicious code, scrape protected areas, impersonate others, or use the services for unlawful, misleading, infringing, or harmful activity.',
        ],
      },
      {
        heading: 'Disclaimers and limitation of liability',
        body: [
          'The website and services are provided on an “as is” and “as available” basis except as expressly stated in a written agreement.',
          'To the fullest extent allowed by law, Vibefox Studio will not be liable for indirect, incidental, consequential, special, exemplary, or punitive damages, or for lost profits, lost revenue, lost data, or business interruption.',
          'To the fullest extent allowed by law, our total liability for a claim is limited to the amount you paid to us for the service giving rise to the claim during the three months before the claim arose.',
        ],
      },
      {
        heading: 'Governing law',
        body: [
          'These Terms are governed by the laws of the State of Florida, without regard to conflict-of-law rules. Venue for disputes will be in state or federal courts located in Florida unless a written agreement states otherwise.',
        ],
      },
      {
        heading: 'Changes',
        body: [
          'We may update these Terms from time to time. Continued use of the website or services after updates are posted means you accept the updated Terms.',
        ],
      },
    ],
  },
  'cookie-policy': {
    label: 'Cookie Policy',
    intro:
      'This Cookie Policy explains how Vibefox Studio uses cookies, local storage, session storage, and similar technologies on the website and client portal.',
    sections: [
      {
        heading: 'Essential technologies',
        body: [
          'We use essential cookies or browser storage to operate the website, maintain security, remember login/session preferences, support Supabase authentication, and keep the client and admin portals usable.',
        ],
      },
      {
        heading: 'Analytics and advertising',
        body: [
          'At the time this policy was added, the website does not intentionally include a dedicated third-party advertising pixel or behavioral advertising cookie in the source code reviewed.',
          'If analytics, remarketing, heatmaps, or advertising pixels are added later, this policy and the cookie notice should be updated to describe those tools and any legally required consent or opt-out choices.',
        ],
      },
      {
        heading: 'Managing cookies',
        body: [
          'You can usually block or delete cookies and browser storage through your browser settings. Some features, especially login and portal features, may not work properly if essential storage is disabled.',
        ],
      },
    ],
  },
  'refund-policy': {
    label: 'Refund & Cancellation Policy',
    intro:
      'This policy summarizes how refunds, cancellations, recurring services, and coaching bookings are handled unless a separate written agreement or invoice states different terms.',
    sections: [
      {
        heading: 'Project work',
        body: [
          'Deposits, setup fees, completed work, strategy work, discovery work, custom design, development, content, and other labor already performed are generally non-refundable.',
          'If a project is canceled, any refund or remaining balance is based on the written scope, work completed, third-party costs incurred, and payment terms in the applicable proposal or invoice.',
        ],
      },
      {
        heading: 'Monthly services',
        body: [
          'Monthly retainers, SEO plans, maintenance, and support services may be canceled according to the applicable agreement. Work already performed during a billing period is not refundable unless required by law or agreed in writing.',
        ],
      },
      {
        heading: 'Coaching sessions',
        body: [
          'Coaching purchases reserve time on the calendar. Rescheduling is allowed when requested at least 24 hours before the session. Missed sessions or cancellations with less than 24 hours notice may be non-refundable.',
        ],
      },
      {
        heading: 'Third-party costs',
        body: [
          'Third-party charges such as hosting, domains, stock assets, software, plugins, fonts, advertising spend, payment processing fees, and platform subscriptions are generally non-refundable and subject to the third party’s terms.',
        ],
      },
    ],
  },
  accessibility: {
    label: 'Accessibility Statement',
    intro:
      'Vibefox Studio aims to make its website accessible and usable for as many people as possible.',
    sections: [
      {
        heading: 'Our commitment',
        body: [
          'We work to support practical accessibility through readable content, keyboard-friendly navigation, semantic markup, responsive layouts, sufficient contrast, and ongoing improvements.',
        ],
      },
      {
        heading: 'Feedback',
        body: [
          `If you experience an accessibility issue, email ${BUSINESS_EMAIL} with the page URL, the issue you encountered, your browser/device if available, and the best way to contact you.`,
          'We will review accessibility feedback and make reasonable efforts to address barriers that are within our control.',
        ],
      },
      {
        heading: 'Third-party content',
        body: [
          'Some embedded tools, payment pages, scheduling tools, client systems, or third-party platforms may be outside our direct control. We still want to hear about barriers so we can look for a practical path forward.',
        ],
      },
    ],
  },
  disclaimer: {
    label: 'Website Disclaimer',
    intro:
      'The information on this website is provided for general informational and marketing purposes.',
    sections: [
      {
        heading: 'No professional legal or financial advice',
        body: [
          'Website, SEO, business, software, and marketing content on this site is not legal, tax, accounting, financial, medical, or other regulated professional advice.',
          'You should consult qualified professionals for advice specific to your business, industry, location, advertising claims, privacy obligations, contracts, taxes, or compliance needs.',
        ],
      },
      {
        heading: 'Results and testimonials',
        body: [
          'Any examples, testimonials, portfolio items, or case-study references are illustrative. Results depend on your market, offer, budget, implementation, competition, platform changes, and other factors outside our control.',
          'Testimonials should reflect honest opinions and experiences. Material connections should be disclosed where required by advertising and endorsement rules.',
        ],
      },
      {
        heading: 'External links',
        body: [
          'Links to third-party websites are provided for convenience. We do not control and are not responsible for third-party content, policies, availability, security, or practices.',
        ],
      },
    ],
  },
}

const ALIASES = {
  privacy: 'privacy-policy',
  terms: 'terms-of-service',
  cookies: 'cookie-policy',
  refunds: 'refund-policy',
}

const navItems = [
  ['Privacy', '/privacy-policy'],
  ['Terms', '/terms-of-service'],
  ['Cookies', '/cookie-policy'],
  ['Refunds', '/refund-policy'],
  ['Accessibility', '/accessibility'],
  ['Disclaimer', '/disclaimer'],
]

export default function LegalPage({ type }) {
  const params = useParams()
  const slug = type || params.slug || 'privacy-policy'
  const canonicalSlug = ALIASES[slug] || slug
  const page = LEGAL_PAGES[canonicalSlug]
  const isMobile = useIsMobile()

  if (!page) return <Navigate to="/privacy-policy" replace />

  const seo = getPublicRouteSeo(`/${canonicalSlug}`)
  const isAlias = canonicalSlug !== slug

  if (isAlias) return <Navigate to={`/${canonicalSlug}`} replace />

  return (
    <MarketingLayout hideCTA>
      <SEOHead
        title={seo?.title || `${page.label} | Vibefox Studio`}
        description={seo?.description || page.intro}
        path={`/${canonicalSlug}`}
        appendBrand={false}
        keywords={seo?.keywords}
        noindex={canonicalSlug === 'disclaimer'}
      />

      <section style={{ padding: isMobile ? '112px 18px 64px' : '144px 40px 92px', background: '#f5f3f0' }}>
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          <div style={{ marginBottom: isMobile ? 28 : 38 }}>
            <p style={{ margin: '0 0 12px', color: '#b8906a', fontSize: 12, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase' }}>
              Legal
            </p>
            <h1 style={{ margin: 0, color: '#18181a', fontSize: isMobile ? 34 : 52, lineHeight: 1.05, fontWeight: 700 }}>
              {page.label}
            </h1>
            <p style={{ color: '#7a7888', fontSize: isMobile ? 15 : 17, lineHeight: 1.7, maxWidth: 720, margin: '18px 0 0' }}>
              {page.intro}
            </p>
            <p style={{ margin: '14px 0 0', color: '#7a7888', fontSize: 13 }}>
              Effective date: {UPDATED_AT}
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '210px minmax(0, 1fr)',
              gap: isMobile ? 24 : 44,
              alignItems: 'start',
            }}
          >
            <aside
              aria-label="Legal pages"
              style={{
                position: isMobile ? 'static' : 'sticky',
                top: 120,
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 12,
                padding: 12,
                background: '#fff',
              }}
            >
              {navItems.map(([label, href]) => {
                const active = href === `/${canonicalSlug}`
                return (
                  <Link
                    key={href}
                    to={href}
                    style={{
                      display: 'block',
                      padding: '10px 12px',
                      borderRadius: 8,
                      color: active ? '#18181a' : '#7a7888',
                      background: active ? '#f3efe9' : 'transparent',
                      fontSize: 13,
                      fontWeight: active ? 700 : 400,
                      textDecoration: 'none',
                    }}
                  >
                    {label}
                  </Link>
                )
              })}
            </aside>

            <article style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {page.sections.map((section) => (
                <section
                  key={section.heading}
                  style={{
                    border: '1px solid rgba(0,0,0,0.08)',
                    borderRadius: 14,
                    background: '#fff',
                    padding: isMobile ? '22px 20px' : '30px 34px',
                  }}
                >
                  <h2 style={{ margin: '0 0 12px', color: '#18181a', fontSize: isMobile ? 20 : 24, lineHeight: 1.25 }}>
                    {section.heading}
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {section.body.map((paragraph) => (
                      <p key={paragraph} style={{ margin: 0, color: '#5f5d68', fontSize: 14, lineHeight: 1.75 }}>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </section>
              ))}

              <section style={{ border: '1px solid rgba(184,144,106,0.25)', borderRadius: 14, background: '#faf9f7', padding: isMobile ? '22px 20px' : '28px 34px' }}>
                <h2 style={{ margin: '0 0 10px', color: '#18181a', fontSize: 20 }}>Contact</h2>
                <p style={{ margin: 0, color: '#5f5d68', fontSize: 14, lineHeight: 1.75 }}>
                  Questions about these terms or policies can be sent to{' '}
                  <a href={`mailto:${BUSINESS_EMAIL}`} style={{ color: '#8f6844', fontWeight: 700 }}>
                    {BUSINESS_EMAIL}
                  </a>
                  .
                </p>
              </section>
            </article>
          </div>
        </div>
      </section>
    </MarketingLayout>
  )
}
