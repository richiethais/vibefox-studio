import { useState, useRef } from 'react'
import { useFadeUp } from './useFadeUp'
import Eyebrow from './Eyebrow'
import { h2Style, subStyle } from './sectionStyles'
import useIsMobile from './useIsMobile'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import NumberFlow from '@number-flow/react'
import { Check, Star } from 'lucide-react'

const plans = [
  {
    name: 'Starter',
    price: 200,
    yearlyPrice: 160,
    desc: 'Keep your site running reliably.',
    features: [
      'Hosting & SSL certificate',
      'Uptime monitoring',
      'Security updates',
      'Database management',
      'Minor content updates',
      '48-hour support response',
    ],
    featured: false,
  },
  {
    name: 'Growth',
    price: 500,
    yearlyPrice: 400,
    desc: 'For businesses that want to grow.',
    features: [
      'Everything in Starter',
      'SEO optimization',
      '2 blog posts per month',
      'Search Console monitoring',
      'Monthly performance report',
      'Minor design updates',
      '24-hour priority support',
    ],
    featured: true,
    badge: 'Most popular',
  },
  {
    name: 'Pro',
    price: 900,
    yearlyPrice: 720,
    desc: 'Full-service digital partner.',
    features: [
      'Everything in Growth',
      '4 blog posts per month',
      'Active link building',
      'Quarterly section redesign',
      'Conversion optimization',
      'Same-day priority support',
      'Monthly strategy call',
    ],
    featured: false,
  },
]

export default function Pricing() {
  const ref = useFadeUp()
  const isMobile = useIsMobile()
  const [isMonthly, setIsMonthly] = useState(true)
  const switchRef = useRef(null)

  const handleToggle = () => {
    const newIsMonthly = !isMonthly
    setIsMonthly(newIsMonthly)

    // Confetti when switching to annual
    if (!newIsMonthly && switchRef.current) {
      const rect = switchRef.current.getBoundingClientRect()
      const x = rect.left + rect.width / 2
      const y = rect.top + rect.height / 2

      confetti({
        particleCount: 50,
        spread: 60,
        origin: {
          x: x / window.innerWidth,
          y: y / window.innerHeight,
        },
        colors: ['#c8a97e', '#b8906a', '#7a7888', '#18181a'],
        ticks: 200,
        gravity: 1.2,
        decay: 0.94,
        startVelocity: 30,
        shapes: ['circle'],
      })
    }
  }

  return (
    <section id="pricing" ref={ref} style={{ padding: isMobile ? '80px 18px' : '96px 40px' }}>
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>
        <Eyebrow>Retainer plans</Eyebrow>
        <h2
          className="fade-up d1"
          style={{
            ...h2Style,
            fontSize: isMobile ? 'clamp(30px, 10vw, 44px)' : h2Style.fontSize,
            letterSpacing: isMobile ? '-1px' : h2Style.letterSpacing,
          }}
        >
          Simple, honest <em style={{ fontStyle: 'italic', color: '#b8906a' }}>monthly pricing.</em>
        </h2>
        <p
          className="fade-up d2"
          style={{
            ...subStyle,
            fontSize: isMobile ? 15 : subStyle.fontSize,
            maxWidth: isMobile ? 360 : subStyle.maxWidth,
            lineHeight: isMobile ? 1.58 : subStyle.lineHeight,
          }}
        >
          Month-to-month. No contracts. Cancel anytime. Project quotes separate.
        </p>

        {/* Billing Toggle */}
        <div
          className="fade-up d2"
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 12,
            marginTop: 32,
            marginBottom: 8,
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: isMonthly ? 600 : 400,
              color: isMonthly ? '#18181a' : '#7a7888',
              transition: 'all 0.2s',
            }}
          >
            Monthly
          </span>
          <button
            ref={switchRef}
            onClick={handleToggle}
            style={{
              position: 'relative',
              width: 52,
              height: 28,
              borderRadius: 100,
              border: 'none',
              cursor: 'pointer',
              background: isMonthly ? '#d1ccc5' : '#b8906a',
              transition: 'background 0.2s',
              padding: 0,
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: 3,
                left: isMonthly ? 3 : 25,
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: 'white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                transition: 'left 0.2s',
              }}
            />
          </button>
          <span
            style={{
              fontSize: 14,
              fontWeight: !isMonthly ? 600 : 400,
              color: !isMonthly ? '#18181a' : '#7a7888',
              transition: 'all 0.2s',
            }}
          >
            Annual{' '}
            <span style={{ color: '#b8906a', fontWeight: 600 }}>(Save 20%)</span>
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)',
            gap: 14,
            marginTop: isMobile ? 36 : 52,
            alignItems: 'start',
          }}
        >
          {plans.map((p, i) => (
            <PricingCard
              key={p.name}
              plan={p}
              delay={`d${i + 1}`}
              isMobile={isMobile}
              isMonthly={isMonthly}
              index={i}
            />
          ))}
        </div>

        <p
          className="fade-up"
          style={{
            textAlign: 'center',
            marginTop: 22,
            fontSize: isMobile ? 12 : 13,
            color: '#7a7888',
          }}
        >
          One-time project pricing from $1,500 —{' '}
          <a
            href="mailto:richie@vibefoxstudio.com"
            style={{ color: '#b8906a', textDecoration: 'none' }}
          >
            get a custom quote →
          </a>
        </p>
      </div>
    </section>
  )
}

function PricingCard({ plan, delay, isMobile, isMonthly, index }) {
  const { name, price, yearlyPrice, desc, features, featured, badge } = plan

  return (
    <motion.div
      className={`fade-up ${delay}`}
      initial={{ y: 50, opacity: 0 }}
      whileInView={
        !isMobile
          ? {
              y: featured ? -20 : 0,
              opacity: 1,
              x: index === 2 ? -30 : index === 0 ? 30 : 0,
              scale: index === 0 || index === 2 ? 0.94 : 1.0,
            }
          : { y: 0, opacity: 1 }
      }
      viewport={{ once: true }}
      transition={{
        duration: 1.6,
        type: 'spring',
        stiffness: 100,
        damping: 30,
        delay: 0.1 * index,
        opacity: { duration: 0.5 },
      }}
      style={{
        background: featured ? '#18181a' : '#faf9f7',
        border: featured ? '2px solid #b8906a' : '1px solid rgba(0,0,0,0.08)',
        borderRadius: 16,
        padding: isMobile ? '24px 20px' : '30px 26px',
        position: 'relative',
        boxShadow: featured ? '0 8px 36px rgba(0,0,0,0.15)' : 'none',
        zIndex: featured ? 10 : 1,
        transformOrigin: index === 0 ? 'right' : index === 2 ? 'left' : 'center',
      }}
    >
      {badge && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            background: '#b8906a',
            color: 'white',
            fontSize: 10,
            fontWeight: 700,
            padding: '4px 12px',
            borderBottomLeftRadius: 12,
            borderTopRightRadius: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          <Star style={{ width: 12, height: 12, fill: 'currentColor' }} />
          Popular
        </div>
      )}

      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          color: featured ? 'rgba(255,255,255,0.32)' : '#7a7888',
          marginBottom: 14,
        }}
      >
        {name}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 6 }}>
        <span
          style={{
            fontSize: 16,
            color: featured ? 'rgba(255,255,255,0.35)' : '#7a7888',
            fontWeight: 400,
            marginTop: 8,
          }}
        >
          $
        </span>
        <span
          style={{
            fontFamily: '"DM Serif Display", serif',
            fontSize: isMobile ? 46 : 54,
            color: featured ? 'white' : '#18181a',
            letterSpacing: '-2px',
            lineHeight: 1,
          }}
        >
          <NumberFlow
            value={isMonthly ? price : yearlyPrice}
            format={{
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }}
            transformTiming={{
              duration: 500,
              easing: 'ease-out',
            }}
            willChange
          />
        </span>
        <span
          style={{
            fontSize: 13,
            color: featured ? 'rgba(255,255,255,0.32)' : '#7a7888',
            alignSelf: 'flex-end',
            marginBottom: 4,
          }}
        >
          /mo
        </span>
      </div>

      <div
        style={{
          fontSize: 12,
          color: featured ? 'rgba(255,255,255,0.38)' : '#7a7888',
          marginBottom: 4,
        }}
      >
        {isMonthly ? 'billed monthly' : 'billed annually'}
      </div>

      <div
        style={{
          fontSize: 13,
          color: featured ? 'rgba(255,255,255,0.38)' : '#7a7888',
          marginBottom: 22,
          lineHeight: 1.5,
          fontWeight: 300,
        }}
      >
        {desc}
      </div>
      <div
        style={{
          height: 1,
          background: featured ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
          marginBottom: 18,
        }}
      />

      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: '0 0 26px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {features.map((f) => (
          <li
            key={f}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 9,
              fontSize: 13,
              color: featured ? 'rgba(255,255,255,0.62)' : '#3a3840',
              lineHeight: 1.4,
              fontWeight: 300,
            }}
          >
            <Check
              style={{
                width: 16,
                height: 16,
                color: '#b8906a',
                flexShrink: 0,
                marginTop: 1,
              }}
            />
            {f}
          </li>
        ))}
      </ul>

      <a
        href="mailto:richie@vibefoxstudio.com"
        style={{
          display: 'block',
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
        }}
        onMouseEnter={(e) => {
          if (featured) {
            e.currentTarget.style.background = '#c8a97e'
            e.currentTarget.style.transform = 'translateY(-1px)'
          } else {
            e.currentTarget.style.background = '#edeae5'
          }
        }}
        onMouseLeave={(e) => {
          if (featured) {
            e.currentTarget.style.background = '#b8906a'
            e.currentTarget.style.transform = 'none'
          } else {
            e.currentTarget.style.background = 'transparent'
          }
        }}
      >
        Get started
      </a>
    </motion.div>
  )
}
