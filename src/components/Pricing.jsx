import { useState } from 'react'
import { motion as Motion, AnimatePresence } from 'framer-motion'
import NumberFlow from '@number-flow/react'
import { useFadeUp } from './useFadeUp'
import Eyebrow from './Eyebrow'
import { h2Style, subStyle } from './sectionStyles'
import useIsMobile from './useIsMobile'

const PAYMENT_FREQUENCIES = ['monthly', 'yearly']

const plans = [
  {
    name: 'Starter',
    price: { monthly: 200, yearly: 170 },
    desc: 'Keep your site running reliably.',
    features: ['Hosting & SSL certificate', 'Uptime monitoring', 'Security updates', 'Database management', 'Minor content updates', '48-hour support response'],
    featured: false,
    popular: false,
  },
  {
    name: 'Growth',
    price: { monthly: 500, yearly: 425 },
    desc: 'For businesses that want to grow.',
    features: ['Everything in Starter', 'SEO optimization', '2 blog posts per month', 'Search Console monitoring', 'Monthly performance report', 'Minor design updates', '24-hour priority support'],
    featured: false,
    popular: true,
  },
  {
    name: 'Pro',
    price: { monthly: 900, yearly: 765 },
    desc: 'Full-service digital partner.',
    features: ['Everything in Growth', '4 blog posts per month', 'Active link building', 'Quarterly section redesign', 'Conversion optimization', 'Same-day priority support', 'Monthly strategy call'],
    featured: true,
    popular: false,
  },
]

const projectPlans = [
  {
    name: 'Landing Pages',
    price: '1,500',
    desc: 'High-converting single-page websites tailored for lead generation or product launches.',
    features: ['Custom design & development', 'Conversion optimization', 'Mobile responsiveness', 'Basic SEO setup', 'Analytics integration'],
    featured: false,
    requiresGrowthPlan: true,
  },
  {
    name: 'Company Sites',
    price: '3,500',
    desc: 'Professional multi-page websites designed to establish your brand and drive growth.',
    features: ['Everything in Landing Pages', 'Up to 10 pages', 'Advanced SEO foundation', 'Content management system (CMS)', 'Performance optimization'],
    featured: true,
    requiresGrowthPlan: true,
  },
  {
    name: 'Custom Web Apps/CRM',
    price: 'Custom',
    desc: 'Tailored software solutions for your unique business logic and operations.',
    features: ['Custom user portals', 'Third-party integrations', 'Database architecture', 'Automated workflows', 'Scalable infrastructure'],
    featured: false,
    requiresGrowthPlan: false,
  },
]

export default function Pricing() {
  const ref = useFadeUp()
  const isMobile = useIsMobile()
  const [selectedFrequency, setSelectedFrequency] = useState('monthly')
  const [activeTab, setActiveTab] = useState('growth')

  return (
    <section id="pricing" ref={ref} style={{ padding: isMobile ? '48px 18px' : '96px 40px' }}>
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>
        <div className="fade-up" style={{ textAlign: 'center', marginBottom: isMobile ? 24 : 48 }}>
          <Eyebrow>Pricing</Eyebrow>
          <h2 className="fade-up d1" style={{ ...h2Style, fontSize: isMobile ? 'clamp(24px, 7.5vw, 34px)' : h2Style.fontSize, letterSpacing: isMobile ? '-0.8px' : h2Style.letterSpacing }}>
            Simple, honest <em style={{ fontStyle: 'italic', color: '#b8906a' }}>pricing.</em>
          </h2>
          {!isMobile && (
            <p className="fade-up d2" style={{ ...subStyle, margin: '14px auto 0' }}>
              Month-to-month. No contracts. Cancel anytime. Project quotes separate.
            </p>
          )}
        </div>

        {isMobile ? (
          /* Mobile: Tabbed pricing interface */
          <>
            {/* Section toggle: Growth Plans / One-time */}
            <div className="fade-up d2" style={{ display: 'flex', background: '#edeae5', borderRadius: 100, padding: 3, marginBottom: 20, width: '100%' }}>
              {[['growth', 'Monthly Plans'], ['projects', 'One-time Projects']].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  style={{
                    flex: 1, padding: '10px 6px', fontSize: 12, fontWeight: 600,
                    background: activeTab === key ? '#faf9f7' : 'transparent',
                    boxShadow: activeTab === key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    border: 'none', borderRadius: 100, cursor: 'pointer',
                    color: '#18181a', transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {activeTab === 'growth' && (
              <>
                {/* Frequency Toggle */}
                <div className="fade-up d3" style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                  <div style={{ display: 'flex', background: '#edeae5', borderRadius: 100, padding: 3 }}>
                    {PAYMENT_FREQUENCIES.map((freq) => (
                      <FrequencyTab
                        key={freq}
                        text={freq}
                        selected={selectedFrequency === freq}
                        setSelected={setSelectedFrequency}
                        discount={freq === 'yearly'}
                      />
                    ))}
                  </div>
                </div>

                {/* Featured plan first (Pro), then others as compact rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* Show popular plan (Growth) featured on mobile */}
                  <PricingCard plan={plans[1]} delay="d1" isMobile={true} paymentFrequency={selectedFrequency} />
                  {/* Compact cards for Starter and Pro */}
                  {[plans[0], plans[2]].map((p, i) => (
                    <CompactPricingRow key={p.name} plan={p} paymentFrequency={selectedFrequency} />
                  ))}
                </div>
              </>
            )}

            {activeTab === 'projects' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {projectPlans.map((p) => (
                  <CompactProjectRow key={p.name} plan={p} />
                ))}
              </div>
            )}
          </>
        ) : (
          /* Desktop: Original layout */
          <>
            {/* Frequency Toggle */}
            <div className="fade-up d3" style={{ display: 'flex', justifyContent: 'center', marginBottom: 36 }}>
              <div style={{ display: 'flex', background: '#edeae5', borderRadius: 100, padding: 4 }}>
                {PAYMENT_FREQUENCIES.map((freq) => (
                  <FrequencyTab
                    key={freq}
                    text={freq}
                    selected={selectedFrequency === freq}
                    setSelected={setSelectedFrequency}
                    discount={freq === 'yearly'}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, alignItems: 'start' }}>
              {plans.map((p, i) => (
                <PricingCard key={p.name} plan={p} delay={`d${i + 1}`} isMobile={false} paymentFrequency={selectedFrequency} />
              ))}
            </div>

            <div className="fade-up" style={{ textAlign: 'center', marginTop: 80, marginBottom: 48 }}>
              <Eyebrow>One-time Projects</Eyebrow>
              <h2 className="fade-up d1" style={h2Style}>
                Build something <em style={{ fontStyle: 'italic', color: '#b8906a' }}>unforgettable.</em>
              </h2>
              <p className="fade-up d2" style={{ ...subStyle, margin: '14px auto 0' }}>
                High-performance websites and web applications built from scratch. Project costs are one-time investments.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, alignItems: 'start' }}>
              {projectPlans.map((p, i) => (
                <ProjectCard key={p.name} plan={p} delay={`d${i + 1}`} isMobile={false} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}

function FrequencyTab({ text, selected, setSelected, discount = false }) {
  return (
    <button
      onClick={() => setSelected(text)}
      style={{
        position: 'relative',
        padding: '10px 16px',
        fontSize: 13,
        fontWeight: 600,
        textTransform: 'capitalize',
        color: '#18181a',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        borderRadius: 100,
      }}
    >
      <span style={{ position: 'relative', zIndex: 10 }}>{text}</span>
      {selected && (
        <Motion.span
          layoutId="frequency-tab"
          transition={{ type: 'spring', duration: 0.4 }}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            borderRadius: 100,
            background: '#faf9f7',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}
        />
      )}
      {discount && (
        <span
          style={{
            position: 'relative',
            zIndex: 10,
            fontSize: 9,
            fontWeight: 700,
            padding: '3px 7px',
            borderRadius: 100,
            background: selected ? '#edeae5' : 'rgba(184,144,106,0.15)',
            color: '#b8906a',
            whiteSpace: 'nowrap',
          }}
        >
          Save 15%
        </span>
      )}
    </button>
  )
}

function PricingCard({ plan, delay, isMobile, paymentFrequency }) {
  const { name, price, desc, features, featured, popular } = plan
  const currentPrice = price[paymentFrequency]

  return (
    <div
      className={`fade-up ${delay}`}
      style={{
        background: featured ? '#18181a' : '#faf9f7',
        border: popular ? '2px solid #b8906a' : featured ? 'none' : '1px solid rgba(0,0,0,0.08)',
        borderRadius: 16,
        padding: isMobile ? '22px 18px' : '30px 26px',
        position: 'relative',
        boxShadow: featured ? '0 8px 36px rgba(0,0,0,0.15)' : 'none',
        transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)',
        overflow: 'hidden',
      }}
      onMouseEnter={e => { if (!isMobile) { e.currentTarget.style.transform = 'translateY(-4px)'; if (!featured) e.currentTarget.style.boxShadow = '0 14px 40px rgba(0,0,0,0.07)' }}}
      onMouseLeave={e => { if (!isMobile) { e.currentTarget.style.transform = 'none'; if (!featured) e.currentTarget.style.boxShadow = 'none' }}}
    >
      {/* Background patterns */}
      {featured && <HighlightedBackground />}
      {popular && <PopularBackground />}

      {/* Plan name with badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: featured ? 'rgba(255,255,255,0.32)' : '#7a7888' }}>
          {name}
        </span>
        {popular && (
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            padding: '3px 9px',
            borderRadius: 100,
            background: 'rgba(184,144,106,0.15)',
            color: '#b8906a',
            whiteSpace: 'nowrap',
            position: 'relative',
            zIndex: 10,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="#b8906a" stroke="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
            Most Popular
          </span>
        )}
      </div>

      {/* Animated price — fixed alignment */}
      <div style={{ position: 'relative', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
          <NumberFlow
            value={currentPrice}
            format={{ style: 'currency', currency: 'USD', trailingZeroDisplay: 'stripIfInteger' }}
            style={{
              fontFamily: '"DM Serif Display", serif',
              fontSize: isMobile ? 40 : 54,
              color: featured ? 'white' : '#18181a',
              letterSpacing: '-2px',
              lineHeight: 1.1,
            }}
          />
          <span style={{ fontSize: 13, color: featured ? 'rgba(255,255,255,0.3)' : '#7a7888', fontWeight: 400, marginLeft: 4 }}>/mo</span>
        </div>
      </div>

      <div style={{ fontSize: isMobile ? 12 : 13, color: featured ? 'rgba(255,255,255,0.38)' : '#7a7888', marginBottom: 18, lineHeight: 1.5, fontWeight: 300 }}>{desc}</div>
      <div style={{ height: 1, background: featured ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', marginBottom: 16 }} />

      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 22px', display: 'flex', flexDirection: 'column', gap: isMobile ? 8 : 10 }}>
        {features.map(f => (
          <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: isMobile ? 12 : 13, color: featured ? 'rgba(255,255,255,0.62)' : '#3a3840', lineHeight: 1.4, fontWeight: 300 }}>
            <CheckIcon featured={featured} />
            {f}
          </li>
        ))}
      </ul>

      <a
        href="mailto:richie@vibefoxstudio.com"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          textAlign: 'center',
          padding: isMobile ? 11 : 12,
          borderRadius: 100,
          fontSize: isMobile ? 13 : 14,
          fontWeight: 500,
          textDecoration: 'none',
          transition: 'all 0.2s',
          background: featured || popular ? '#b8906a' : 'transparent',
          border: featured || popular ? '1.5px solid #b8906a' : '1.5px solid rgba(0,0,0,0.08)',
          color: featured || popular ? 'white' : '#18181a',
          boxShadow: featured || popular ? '0 4px 14px rgba(184,144,106,0.3)' : 'none',
          position: 'relative',
          zIndex: 10,
          cursor: 'pointer',
        }}
        onMouseEnter={e => {
          if (featured || popular) { e.currentTarget.style.background = '#c8a97e'; e.currentTarget.style.transform = 'translateY(-1px)' }
          else e.currentTarget.style.background = '#edeae5'
        }}
        onMouseLeave={e => {
          if (featured || popular) { e.currentTarget.style.background = '#b8906a'; e.currentTarget.style.transform = 'none' }
          else e.currentTarget.style.background = 'transparent'
        }}
      >
        Get started
        <ArrowIcon />
      </a>
    </div>
  )
}

/* Compact pricing row for mobile non-featured plans */
function CompactPricingRow({ plan, paymentFrequency }) {
  const { name, price, desc, featured } = plan
  const currentPrice = price[paymentFrequency]

  return (
    <a
      href="mailto:richie@vibefoxstudio.com"
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: featured ? '#18181a' : '#faf9f7',
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: 14, padding: '16px 18px',
        textDecoration: 'none', cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: featured ? 'white' : '#18181a', letterSpacing: '-0.2px' }}>{name}</div>
        <div style={{ fontSize: 12, color: featured ? 'rgba(255,255,255,0.4)' : '#7a7888', fontWeight: 300, marginTop: 2 }}>{desc}</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
        <div style={{ fontFamily: '"DM Serif Display", serif', fontSize: 24, color: featured ? 'white' : '#18181a', letterSpacing: '-1px', lineHeight: 1 }}>
          ${currentPrice}
        </div>
        <div style={{ fontSize: 10, color: featured ? 'rgba(255,255,255,0.3)' : '#7a7888' }}>/mo</div>
      </div>
    </a>
  )
}

/* Compact project row for mobile */
function CompactProjectRow({ plan }) {
  const { name, price, desc, featured } = plan

  return (
    <a
      href="mailto:richie@vibefoxstudio.com"
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: featured ? '#18181a' : '#faf9f7',
        border: featured ? 'none' : '1px solid rgba(0,0,0,0.08)',
        borderRadius: 14, padding: '16px 18px',
        textDecoration: 'none', cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: featured ? 'white' : '#18181a', letterSpacing: '-0.2px' }}>{name}</div>
        <div style={{ fontSize: 12, color: featured ? 'rgba(255,255,255,0.4)' : '#7a7888', fontWeight: 300, marginTop: 2 }}>{desc}</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
        <div style={{ fontFamily: '"DM Serif Display", serif', fontSize: price === 'Custom' ? 18 : 24, color: featured ? 'white' : '#18181a', letterSpacing: '-1px', lineHeight: 1 }}>
          {price === 'Custom' ? 'Custom' : `$${price}`}
        </div>
        {price !== 'Custom' && <div style={{ fontSize: 10, color: featured ? 'rgba(255,255,255,0.3)' : '#7a7888' }}>starting</div>}
      </div>
    </a>
  )
}

function ProjectCard({ plan, delay, isMobile }) {
  const { name, price, desc, features, featured, requiresGrowthPlan } = plan

  return (
    <div
      className={`fade-up ${delay}`}
      style={{
        background: featured ? '#18181a' : '#faf9f7',
        border: featured ? 'none' : '1px solid rgba(0,0,0,0.08)',
        borderRadius: 16,
        padding: '30px 26px',
        position: 'relative',
        boxShadow: featured ? '0 8px 36px rgba(0,0,0,0.15)' : 'none',
        transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)',
        overflow: 'hidden',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; if (!featured) e.currentTarget.style.boxShadow = '0 14px 40px rgba(0,0,0,0.07)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; if (!featured) e.currentTarget.style.boxShadow = 'none' }}
    >
      {/* Background patterns */}
      {featured && <HighlightedBackground />}

      {/* Plan name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: featured ? 'rgba(255,255,255,0.32)' : '#7a7888' }}>
          {name}
        </span>
      </div>

      {/* Price — fixed alignment, no fixed height container */}
      <div style={{ position: 'relative', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
          {price !== 'Custom' && <span style={{ fontFamily: '"DM Serif Display", serif', fontSize: 16, fontWeight: 400, color: featured ? 'rgba(255,255,255,0.6)' : '#7a7888' }}>$</span>}
          <span style={{
            fontFamily: '"DM Serif Display", serif',
            fontSize: price === 'Custom' ? 36 : 54,
            color: featured ? 'white' : '#18181a',
            letterSpacing: '-2px',
            lineHeight: 1.1,
          }}>
            {price === 'Custom' ? 'Custom' : price}
          </span>
          {price !== 'Custom' && <span style={{ fontSize: 13, color: featured ? 'rgba(255,255,255,0.3)' : '#7a7888', fontWeight: 400, marginLeft: 4 }}>one-time</span>}
        </div>
        <p style={{ fontSize: 12, color: featured ? 'rgba(255,255,255,0.32)' : '#7a7888', marginTop: 4 }}>
          {requiresGrowthPlan ? 'Plus monthly growth plan' : 'Project investment'}
        </p>
      </div>

      <div style={{ fontSize: 13, color: featured ? 'rgba(255,255,255,0.38)' : '#7a7888', marginBottom: 18, lineHeight: 1.5, fontWeight: 300 }}>{desc}</div>
      <div style={{ height: 1, background: featured ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', marginBottom: 16 }} />

      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {features.map(f => (
          <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: featured ? 'rgba(255,255,255,0.62)' : '#3a3840', lineHeight: 1.4, fontWeight: 300 }}>
            <CheckIcon featured={featured} />
            {f}
          </li>
        ))}
      </ul>

      <a
        href="mailto:richie@vibefoxstudio.com"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          textAlign: 'center',
          padding: 12,
          borderRadius: 100,
          fontSize: 14,
          fontWeight: 500,
          textDecoration: 'none',
          transition: 'all 0.2s',
          background: featured ? '#b8906a' : 'transparent',
          border: featured ? '1.5px solid #b8906a' : '1.5px solid rgba(0,0,0,0.08)',
          color: featured ? 'white' : '#18181a',
          boxShadow: featured ? '0 4px 14px rgba(184,144,106,0.3)' : 'none',
          position: 'relative',
          zIndex: 10,
          cursor: 'pointer',
        }}
        onMouseEnter={e => {
          if (featured) { e.currentTarget.style.background = '#c8a97e'; e.currentTarget.style.transform = 'translateY(-1px)' }
          else e.currentTarget.style.background = '#edeae5'
        }}
        onMouseLeave={e => {
          if (featured) { e.currentTarget.style.background = '#b8906a'; e.currentTarget.style.transform = 'none' }
          else e.currentTarget.style.background = 'transparent'
        }}
      >
        Get a quote
        <ArrowIcon />
      </a>
    </div>
  )
}


function CheckIcon({ featured }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      style={{ flexShrink: 0, marginTop: 1 }}
    >
      <path
        d="M9 12.75L11.25 15L15 9.75M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
        stroke={featured ? '#c8a97e' : '#b8906a'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

function HighlightedBackground() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to right, rgba(79,79,79,0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(79,79,79,0.18) 1px, transparent 1px)',
        backgroundSize: '45px 45px',
        maskImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, #000 70%, transparent 110%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, #000 70%, transparent 110%)',
      }}
    />
  )
}

function PopularBackground() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse 80% 80% at 50% -20%, rgba(184,144,106,0.08), rgba(255,255,255,0))',
      }}
    />
  )
}
