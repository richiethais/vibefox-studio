import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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

export default function Pricing() {
  const ref = useFadeUp()
  const isMobile = useIsMobile()
  const [selectedFrequency, setSelectedFrequency] = useState('monthly')

  return (
    <section id="pricing" ref={ref} style={{ padding: isMobile ? '80px 18px' : '96px 40px' }}>
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>
        <div className="fade-up" style={{ textAlign: 'center', marginBottom: isMobile ? 36 : 48 }}>
          <Eyebrow>Retainer plans</Eyebrow>
          <h2 className="fade-up d1" style={{ ...h2Style, fontSize: isMobile ? 'clamp(30px, 10vw, 44px)' : h2Style.fontSize, letterSpacing: isMobile ? '-1px' : h2Style.letterSpacing }}>
            Simple, honest <em style={{ fontStyle: 'italic', color: '#b8906a' }}>monthly pricing.</em>
          </h2>
          <p className="fade-up d2" style={{ ...subStyle, fontSize: isMobile ? 15 : subStyle.fontSize, maxWidth: isMobile ? 360 : subStyle.maxWidth, lineHeight: isMobile ? 1.58 : subStyle.lineHeight, margin: '14px auto 0' }}>
            Month-to-month. No contracts. Cancel anytime. Project quotes separate.
          </p>

          {/* Frequency Toggle */}
          <div className="fade-up d3" style={{ display: 'flex', justifyContent: 'center', marginTop: 28 }}>
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
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 14, alignItems: 'start' }}>
          {plans.map((p, i) => (
            <PricingCard key={p.name} plan={p} delay={`d${i + 1}`} isMobile={isMobile} paymentFrequency={selectedFrequency} />
          ))}
        </div>

        <p className="fade-up" style={{ textAlign: 'center', marginTop: 22, fontSize: isMobile ? 12 : 13, color: '#7a7888' }}>
          One-time project pricing from $1,500 —{' '}
          <a href="mailto:richie@vibefoxstudio.com" style={{ color: '#b8906a', textDecoration: 'none' }}>get a custom quote →</a>
        </p>
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
        padding: '10px 20px',
        fontSize: 14,
        fontWeight: 600,
        textTransform: 'capitalize',
        color: '#18181a',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        borderRadius: 100,
      }}
    >
      <span style={{ position: 'relative', zIndex: 10 }}>{text}</span>
      {selected && (
        <motion.span
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
            fontSize: 10,
            fontWeight: 700,
            padding: '4px 8px',
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
        padding: isMobile ? '24px 20px' : '30px 26px',
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
      {popular && <PopularBackground />}

      {/* Plan name with badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: featured ? 'rgba(255,255,255,0.32)' : '#7a7888' }}>
          {name}
        </span>
        {popular && (
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: 100,
            background: 'rgba(184,144,106,0.15)',
            color: '#b8906a',
            whiteSpace: 'nowrap',
            position: 'relative',
            zIndex: 10,
          }}>
            🔥 Most Popular
          </span>
        )}
      </div>

      {/* Animated price */}
      <div style={{ position: 'relative', height: 60, marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
          <NumberFlow
            value={currentPrice}
            format={{ style: 'currency', currency: 'USD', trailingZeroDisplay: 'stripIfInteger' }}
            style={{
              fontFamily: '"DM Serif Display", serif',
              fontSize: isMobile ? 46 : 54,
              color: featured ? 'white' : '#18181a',
              letterSpacing: '-2px',
              lineHeight: 1,
            }}
          />
        </div>
        <p style={{ fontSize: 12, color: featured ? 'rgba(255,255,255,0.32)' : '#7a7888', marginTop: -2 }}>
          Per month
        </p>
      </div>

      <div style={{ fontSize: 13, color: featured ? 'rgba(255,255,255,0.38)' : '#7a7888', marginBottom: 22, lineHeight: 1.5, fontWeight: 300 }}>{desc}</div>
      <div style={{ height: 1, background: featured ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', marginBottom: 18 }} />

      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 26px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {features.map(f => (
          <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 13, color: featured ? 'rgba(255,255,255,0.62)' : '#3a3840', lineHeight: 1.4, fontWeight: 300 }}>
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
        Get started
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
