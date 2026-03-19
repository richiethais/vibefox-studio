# Mobile Redesign, Contact Page, Retainer Rebrand & Services Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebrand "retainer" → "growth plan", create dedicated `/contact` page, redesign mobile nav as full-screen overlay with contact pill, redesign services page with deep-dive sections, and apply mobile-first polish across all components.

**Architecture:** This is a UI-only refactor touching ~12 files. No backend changes. The Contact page reuses existing Supabase submission logic. Mobile nav gets `AnimatePresence` from Framer Motion (already installed). Services page is a full rewrite of `ServicesPage.jsx` using existing components as building blocks.

**Tech Stack:** React 19, React Router DOM v7, Framer Motion 12, Tailwind CSS (via inline styles), Supabase Edge Functions

---

## Task 1: "Retainer" → "Growth Plan" Global Rebrand

**Files:**
- Modify: `src/components/Pricing.jsx` (line 47)
- Modify: `src/components/Contact.jsx` (line 7)
- Modify: `src/components/Hero.jsx` (lines 104, 157)
- Modify: `src/components/FAQ.jsx` (lines 8, 10, 11)
- Modify: `src/components/HowItWorks.jsx` (line 9)
- Modify: `src/pages/marketing/PricingPage.jsx` (line 15)

**Step 1: Replace in Pricing.jsx**

Line 47 — change eyebrow text:
```jsx
// Old
<Eyebrow>Retainer plans</Eyebrow>
// New
<Eyebrow>Growth Plans</Eyebrow>
```

**Step 2: Replace in Contact.jsx**

Line 7 — change service option:
```jsx
// Old
const services = ['Landing Page', 'Business Website', 'Custom Web App', 'E-commerce', 'Retainer', 'Other']
// New
const services = ['Landing Page', 'Business Website', 'Custom Web App', 'E-commerce', 'Growth Plan', 'Other']
```

**Step 3: Replace in Hero.jsx**

Line 104 — change trust badge:
```jsx
// Old
{['Fast turnaround', 'Jacksonville local SEO', 'Retainers available'].map(t => (
// New
{['Fast turnaround', 'Jacksonville local SEO', 'Growth plans available'].map(t => (
```

Line 157 — change dashboard item:
```jsx
// Old
{ name: 'Retainer renewal', desc: 'Growth plan — month 4 of 12', ...
// New
{ name: 'Plan renewal', desc: 'Growth plan — month 4 of 12', ...
```

**Step 4: Replace in FAQ.jsx**

Line 8 — first FAQ answer:
```
// Old: "Retainer plans are optional but recommended to keep everything running after launch."
// New: "Growth plans are optional but recommended to keep everything running after launch."
```

Line 10 — third FAQ question:
```
// Old: 'What counts as a "minor update" in the retainer?'
// New: 'What counts as a "minor update" in the growth plan?'
```

Line 11 — fourth FAQ Q&A:
```
// Old Q: "Do I need to sign a long-term contract?"
// Old A: "No. Retainer plans are month-to-month and can be cancelled with 30 days notice..."
// New A: "No. Growth plans are month-to-month and can be cancelled with 30 days notice..."
```

**Step 5: Replace in HowItWorks.jsx**

Line 9 — step 3 description:
```
// Old: 'We handle launch, hosting, and SSL. Your retainer keeps everything running and improving each month.'
// New: 'We handle launch, hosting, and SSL. Your growth plan keeps everything running and improving each month.'
```

**Step 6: Replace in PricingPage.jsx**

Line 15 — SEO keywords:
```
// Old: "jacksonville digital marketing retainer"
// New: "jacksonville digital marketing growth plan"
```

**Step 7: Verify & Commit**

Run: `grep -r "retainer\|Retainer" src/ --include="*.jsx" --include="*.js"` — should return 0 results.

```bash
git add -A && git commit -m "rebrand: rename retainer to growth plan across all components"
```

---

## Task 2: Create Dedicated Contact Page

**Files:**
- Create: `src/pages/marketing/ContactPage.jsx`
- Modify: `src/main.jsx` (add route)

**Step 1: Create ContactPage.jsx**

Create `src/pages/marketing/ContactPage.jsx`:

```jsx
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { parseFunctionError } from '../../lib/supabaseFunctions'
import SEOHead from '../../components/SEOHead'
import MarketingLayout from '../../components/marketing/MarketingLayout'
import useIsMobile from '../../components/useIsMobile'

const services = ['Landing Page', 'Business Website', 'Custom Web App', 'E-commerce', 'Growth Plan', 'Other']
const budgets = ['Under $1,000', '$1,000–$3,000', '$3,000–$10,000', '$10,000+']

export default function ContactPage() {
  const isMobile = useIsMobile()
  const [form, setForm] = useState({ name: '', email: '', company: '', service_type: '', budget: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const canSubmit = Boolean(form.name.trim() && form.email.trim() && form.service_type && form.budget && form.message.trim())

  function set(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit || loading) return
    setLoading(true)
    setError('')
    const payload = {
      ...form,
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      company: form.company.trim(),
      message: form.message.trim(),
    }
    const { error } = await supabase.functions.invoke('submit-inquiry', {
      body: { ...payload, form_key: 'contact' },
    })
    if (error) {
      const details = await parseFunctionError(error, 'Something went wrong. Please email us directly.')
      setError(details.message)
      setLoading(false)
      return
    }
    setDone(true)
    setLoading(false)
  }

  return (
    <MarketingLayout hideCTA>
      <SEOHead
        title="Contact VibefoxStudio | Jacksonville Digital Marketing Agency"
        description="Get in touch with VibefoxStudio. Tell us about your project and our Jacksonville digital marketing team will respond within 24 hours."
        path="/contact"
        keywords="contact jacksonville digital marketing agency, web design inquiry jacksonville florida"
      />

      <section style={{ padding: isMobile ? '128px 18px 72px' : '160px 40px 96px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          {/* Hero */}
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 56 }}>
            <div className="anim-rise-1" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#b8906a', marginBottom: 14 }}>
              Get in touch
            </div>
            <h1 className="anim-rise-2" style={{
              fontFamily: '"DM Serif Display", serif',
              fontSize: isMobile ? 'clamp(32px, 10vw, 44px)' : 'clamp(40px, 5vw, 56px)',
              lineHeight: 1.04, color: '#18181a', letterSpacing: '-1.5px', margin: '0 0 16px',
            }}>
              Let's build something <em style={{ fontStyle: 'italic', color: '#b8906a' }}>great.</em>
            </h1>
            <p className="anim-rise-3" style={{ fontSize: isMobile ? 15 : 17, color: '#7a7888', maxWidth: 440, margin: '0 auto', fontWeight: 300, lineHeight: 1.68 }}>
              Tell us what you need. We typically respond within 24 hours.
            </p>
          </div>

          {/* Two-column layout */}
          <div className="anim-rise-4" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 340px', gap: isMobile ? 40 : 56, alignItems: 'start' }}>
            {/* Left: Form */}
            <div>
              {done ? (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 14, padding: 32, textAlign: 'center' }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', border: '1.5px solid #16a34a', margin: '0 auto 12px', position: 'relative' }}>
                    <span style={{ position: 'absolute', inset: 6, borderRadius: '50%', background: '#16a34a' }} />
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 500, color: '#15803d', marginBottom: 6 }}>Message sent!</div>
                  <div style={{ fontSize: 14, color: '#16a34a' }}>We'll get back to you within 24 hours.</div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
                    <input placeholder="Your name *" value={form.name} onChange={set('name')} required style={inp} />
                    <input placeholder="Email address *" type="email" value={form.email} onChange={set('email')} required style={inp} />
                  </div>
                  <input placeholder="Company (optional)" value={form.company} onChange={set('company')} style={inp} />
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
                    <select value={form.service_type} onChange={set('service_type')} required style={inp}>
                      <option value="">Service interest *</option>
                      {services.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <select value={form.budget} onChange={set('budget')} required style={inp}>
                      <option value="">Budget range *</option>
                      {budgets.map(b => <option key={b}>{b}</option>)}
                    </select>
                  </div>
                  <textarea placeholder="Tell us about your project *" value={form.message} onChange={set('message')} required rows={5} style={{ ...inp, resize: 'vertical' }} />
                  {error && <p style={{ fontSize: 13, color: '#dc2626', margin: 0 }}>{error}</p>}
                  <button type="submit" disabled={loading || !canSubmit} style={{
                    padding: '14px 28px', borderRadius: 100, border: 'none',
                    background: '#18181a', color: 'white', fontSize: 15, fontWeight: 500,
                    cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                    alignSelf: isMobile ? 'stretch' : 'flex-start', transition: 'all 0.2s',
                  }}>
                    {loading ? 'Sending…' : 'Send message →'}
                  </button>
                </form>
              )}
            </div>

            {/* Right: Trust signals */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, order: isMobile ? -1 : 0 }}>
              {[
                { icon: 'clock', title: 'Quick response', desc: 'We typically reply within 24 hours — often same day.' },
                { icon: 'pin', title: 'Jacksonville, FL', desc: 'Local team. We know the market and the businesses here.' },
                { icon: 'shield', title: 'No pressure', desc: 'Just a real conversation about your goals. No sales pitch.' },
              ].map(item => (
                <div key={item.title} style={{
                  display: 'flex', gap: 14, padding: '18px 20px',
                  background: '#faf9f7', border: '1px solid rgba(0,0,0,0.08)',
                  borderRadius: 14,
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: 'rgba(200,169,126,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <TrustIcon type={item.icon} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#18181a', marginBottom: 3 }}>{item.title}</div>
                    <div style={{ fontSize: 13, color: '#7a7888', lineHeight: 1.5, fontWeight: 300 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  )
}

function TrustIcon({ type }) {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: '#b8906a', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (type === 'clock') return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
  if (type === 'pin') return <svg {...common}><path d="M12 21s-7-5.5-7-11a7 7 0 0114 0c0 5.5-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
  return <svg {...common}><path d="M12 3l7 3v6c0 5-3.5 8.5-7 9-3.5-.5-7-4-7-9V6l7-3z" /><path d="M9.5 12.5l2 2 3-3.5" /></svg>
}

const inp = {
  padding: '12px 16px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)',
  fontSize: 14, color: '#18181a', background: 'white', outline: 'none',
  width: '100%', boxSizing: 'border-box', fontFamily: 'inherit',
}
```

**Step 2: Add route to main.jsx**

After the existing `/faq` route (line 46), add:
```jsx
import ContactPage from './pages/marketing/ContactPage.jsx'
// ...
<Route path="/contact" element={<ContactPage />} />
```

**Step 3: Update MarketingLayout to support `hideCTA` prop**

In `src/components/marketing/MarketingLayout.jsx`, accept a `hideCTA` prop and conditionally render the CTA section:
```jsx
export default function MarketingLayout({ children, hideCTA = false }) {
  return (
    <>
      <Nav />
      <main style={{ paddingTop: 0 }}>{children}</main>
      {!hideCTA && <CTA />}
      <Footer />
    </>
  )
}
```

**Step 4: Verify & Commit**

Run dev server, navigate to `/contact`, verify form renders and submits.

```bash
git add -A && git commit -m "feat: add dedicated /contact page with trust signals"
```

---

## Task 3: Update All "Get in Touch" Links to `/contact`

**Files:**
- Modify: `src/components/Nav.jsx` (lines 183-197 desktop CTA, lines 251-266 mobile CTA)
- Modify: `src/components/CTAFooter.jsx` (line 26-27 CTA "Start a project" link)
- Modify: `src/components/Hero.jsx` (line 86 "Start a project" link)

**Step 1: Nav.jsx desktop CTA**

Line 183-197 — change `<a href="/#contact">` to `<Link to="/contact">`:
```jsx
// Old
<a href="/#contact" style={{...}} ...>Get in touch →</a>
// New
<Link to="/contact" style={{...}} ...>Get in touch →</Link>
```

**Step 2: Nav.jsx mobile CTA**

Line 251-266 — same change in mobile dropdown:
```jsx
// Old
<a href="/#contact" onClick={() => setMenuOpen(false)} ...>Get in touch →</a>
// New
<Link to="/contact" onClick={() => setMenuOpen(false)} ...>Get in touch →</Link>
```

**Step 3: CTAFooter.jsx "Start a project"**

Line 26-27 — change the primary CTA:
```jsx
// Old
<a href="/#contact" style={{...}} ...>Start a project ...</a>
// New
<a href="/contact" style={{...}} ...>Start a project ...</a>
```

**Step 4: Hero.jsx "Start a project"**

Line 86 — change the hero CTA:
```jsx
// Old
href="#contact"
// New
href="/contact"
```

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: route all Get in touch CTAs to /contact page"
```

---

## Task 4: Mobile Nav — Full-Screen Overlay with Contact Pill

**Files:**
- Modify: `src/components/Nav.jsx` (complete mobile section rewrite)

**Step 1: Add AnimatePresence import**

Line 3 — already imports `motion as Motion`, add `AnimatePresence`:
```jsx
import { motion as Motion, AnimatePresence } from 'framer-motion'
```

**Step 2: Add body scroll lock effect**

Inside the `Nav` component, add:
```jsx
useEffect(() => {
  if (menuOpen) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
  return () => { document.body.style.overflow = '' }
}, [menuOpen])
```

**Step 3: Replace mobile nav bar — add Contact pill**

Replace the mobile button section (lines 68-93) with:
```jsx
{isMobile ? (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <Link
      to="/contact"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: '#18181a', color: '#fff',
        padding: '8px 16px', borderRadius: 100,
        fontSize: 12, fontWeight: 500,
        textDecoration: 'none', whiteSpace: 'nowrap',
        transition: 'all 0.2s',
      }}
    >
      Contact
    </Link>
    <button
      aria-label={menuOpen ? 'Close menu' : 'Open menu'}
      onClick={() => setMenuOpen(v => !v)}
      style={{
        width: 44, height: 44, borderRadius: '50%',
        border: '1px solid rgba(0,0,0,0.1)',
        background: 'white', color: '#18181a', fontSize: 18,
        cursor: 'pointer', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {menuOpen ? (
          <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
        ) : (
          <><line x1="3" y1="7" x2="21" y2="7" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="17" x2="21" y2="17" /></>
        )}
      </svg>
    </button>
  </div>
) : (
```

**Step 4: Replace mobile dropdown with full-screen overlay**

Replace the entire `{isMobile && menuOpen && (...)}` block (lines 203-269) with:
```jsx
<AnimatePresence>
  {isMobile && menuOpen && (
    <Motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(245,243,240,0.96)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 32px 40px',
      }}
    >
      {/* Close button */}
      <button
        aria-label="Close menu"
        onClick={() => setMenuOpen(false)}
        style={{
          position: 'absolute', top: 24, right: 20,
          width: 44, height: 44, borderRadius: '50%',
          border: '1px solid rgba(0,0,0,0.1)',
          background: 'white', color: '#18181a',
          cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Nav links */}
      <nav style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        {links.map(([label, to], i) => (
          <Motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
          >
            <NavLink
              to={to}
              end={to === '/'}
              onClick={() => setMenuOpen(false)}
              style={({ isActive }) => ({
                textDecoration: 'none',
                fontFamily: '"DM Serif Display", serif',
                fontSize: 28,
                color: isActive ? '#b8906a' : '#18181a',
                fontWeight: 400,
                padding: '10px 20px',
                display: 'block',
                textAlign: 'center',
                letterSpacing: '-0.5px',
                transition: 'color 0.18s',
              })}
            >
              {label}
            </NavLink>
          </Motion.div>
        ))}
      </nav>

      {/* CTA button */}
      <Motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: links.length * 0.05 + 0.1, duration: 0.3 }}
        style={{ marginTop: 32 }}
      >
        <Link
          to="/contact"
          onClick={() => setMenuOpen(false)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: '#18181a', color: '#fff',
            padding: '16px 36px', borderRadius: 100,
            fontSize: 16, fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          Get in touch →
        </Link>
      </Motion.div>
    </Motion.div>
  )}
</AnimatePresence>
```

**Step 5: Verify & Commit**

Test on mobile viewport: hamburger opens full-screen overlay, links stagger in, close button works, Contact pill routes to `/contact`, body scroll locked.

```bash
git add -A && git commit -m "feat: full-screen mobile nav overlay with contact pill and animations"
```

---

## Task 5: Services Page — Complete Redesign

**Files:**
- Rewrite: `src/pages/marketing/ServicesPage.jsx`

**Step 1: Rewrite ServicesPage.jsx**

Replace the entire file with a new layout featuring deep-dive service sections:

```jsx
import SEOHead from '../../components/SEOHead'
import MarketingLayout from '../../components/marketing/MarketingLayout'
import Comparison from '../../components/Comparison'
import useIsMobile from '../../components/useIsMobile'
import { useFadeUp } from '../../components/useFadeUp'
import { Link } from 'react-router-dom'

const serviceDetails = [
  {
    icon: 'landing',
    title: 'Landing Pages',
    desc: 'High-converting single pages built for speed. Perfect for campaigns, launches, and service businesses that need results fast.',
    includes: ['Custom design tailored to your brand', 'Mobile-optimized responsive layout', 'SEO-ready structure and meta tags', 'Contact form with lead capture'],
    gradient: 'linear-gradient(135deg, #f0ebff 0%, #e2d8f8 100%)',
  },
  {
    icon: 'website',
    title: 'Business Websites',
    desc: 'Multi-page sites that rank on Google, tell your story, and turn visitors into customers. Built to grow with your business.',
    includes: ['Up to 8 custom-designed pages', 'CMS for easy content updates', 'Google Business integration', 'Analytics and conversion tracking'],
    gradient: 'linear-gradient(135deg, #ebf2ff 0%, #d8e8ff 100%)',
  },
  {
    icon: 'app',
    title: 'Custom Web Apps',
    desc: 'Booking systems, client portals, and dashboards with real user accounts, live data, and file uploads. Full-stack, production-ready.',
    includes: ['User authentication and roles', 'Real-time database and file storage', 'Admin dashboard for management', 'API integrations as needed'],
    gradient: 'linear-gradient(135deg, #fff5eb 0%, #fae3cc 100%)',
  },
  {
    icon: 'seo',
    title: 'SEO & Content',
    desc: 'Weekly blog posts and on-page optimization that compound over time. Organic traffic without paying per click.',
    includes: ['Keyword research and strategy', 'Blog posts written and published', 'Search Console monitoring', 'Monthly performance reports'],
    gradient: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
  },
  {
    icon: 'security',
    title: 'Hosting & Security',
    desc: 'Fast global hosting, SSL certificates, automated backups, uptime monitoring, and security updates. All handled for you.',
    includes: ['99.9% uptime guarantee', 'SSL certificate included', 'Daily automated backups', 'Security patches and monitoring'],
    gradient: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)',
  },
  {
    icon: 'support',
    title: 'Ongoing Support',
    desc: 'Hours, photos, copy — small updates within 48 hours. No tickets, no waiting, no surprise invoices.',
    includes: ['48-hour turnaround on updates', 'Direct communication — no tickets', 'Priority support on growth plans', 'Quarterly strategy reviews'],
    gradient: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
  },
]

export default function ServicesPage() {
  const isMobile = useIsMobile()
  const heroRef = useFadeUp()

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Digital Marketing and Web Development',
    provider: {
      '@type': 'LocalBusiness',
      name: 'VibefoxStudio',
      alternateName: 'Vibefox Studio',
      areaServed: 'Jacksonville, Florida',
      url: 'https://vibefoxstudio.com/services',
    },
    areaServed: { '@type': 'City', name: 'Jacksonville' },
  }

  return (
    <MarketingLayout>
      <SEOHead
        title="VibefoxStudio Services | Jacksonville SEO, Web Design & Growth"
        description="Jacksonville-focused SEO, websites, content strategy, and conversion-focused digital marketing services from VibefoxStudio."
        path="/services"
        noindex
        keywords="digital marketing services jacksonville florida, seo services jacksonville, web design and seo agency jacksonville, best digital marketing agency in jacksonville florida, local marketing company jacksonville"
        structuredData={schema}
      />

      {/* Hero */}
      <section ref={heroRef} style={{ padding: isMobile ? '128px 20px 64px' : '160px 40px 80px', textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div className="fade-up d1" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#b8906a', marginBottom: 14 }}>
            Services
          </div>
          <h1 className="fade-up d2" style={{
            fontFamily: '"DM Serif Display", serif',
            fontSize: isMobile ? 'clamp(32px, 10vw, 44px)' : 'clamp(40px, 5vw, 56px)',
            lineHeight: 1.04, color: '#18181a', letterSpacing: '-1.5px', margin: '0 0 18px',
          }}>
            Everything your business needs to{' '}
            <em style={{ fontStyle: 'italic', color: '#b8906a' }}>grow online.</em>
          </h1>
          <p className="fade-up d3" style={{ fontSize: isMobile ? 15 : 17, color: '#7a7888', maxWidth: 480, margin: '0 auto', fontWeight: 300, lineHeight: 1.68 }}>
            From local SEO to full-stack web apps — we handle strategy, design, development, and ongoing growth.
          </p>
          <div className="fade-up d4" style={{ marginTop: 32 }}>
            <Link
              to="/contact"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                background: '#18181a', color: '#fff',
                padding: '14px 28px', borderRadius: 100,
                fontSize: 15, fontWeight: 500, textDecoration: 'none',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#2a2830'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#18181a'; e.currentTarget.style.transform = 'none' }}
            >
              Start a project <span style={{ width: 22, height: 22, background: 'rgba(255,255,255,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Service deep-dives */}
      {serviceDetails.map((service, i) => (
        <ServiceSection key={service.title} service={service} index={i} isMobile={isMobile} />
      ))}

      {/* Comparison — kept as-is */}
      <Comparison />

      {/* CTA band */}
      <section style={{ padding: isMobile ? '56px 20px' : '72px 40px' }}>
        <div style={{
          maxWidth: 700, margin: '0 auto', textAlign: 'center',
          background: '#faf9f7', border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 20, padding: isMobile ? '40px 24px' : '56px 48px',
        }}>
          <h2 style={{
            fontFamily: '"DM Serif Display", serif',
            fontSize: isMobile ? 'clamp(26px, 8vw, 36px)' : 'clamp(32px, 4vw, 44px)',
            lineHeight: 1.08, color: '#18181a', letterSpacing: '-1px', margin: '0 0 14px',
          }}>
            Ready to get <em style={{ fontStyle: 'italic', color: '#b8906a' }}>started?</em>
          </h2>
          <p style={{ fontSize: isMobile ? 15 : 16, color: '#7a7888', fontWeight: 300, lineHeight: 1.6, marginBottom: 28, maxWidth: 400, margin: '0 auto 28px' }}>
            No pressure. Just a real conversation about your goals.
          </p>
          <Link
            to="/contact"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: '#18181a', color: '#fff',
              padding: '14px 28px', borderRadius: 100,
              fontSize: 15, fontWeight: 500, textDecoration: 'none',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#2a2830'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#18181a'; e.currentTarget.style.transform = 'none' }}
          >
            Get in touch <span style={{ width: 22, height: 22, background: 'rgba(255,255,255,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>→</span>
          </Link>
        </div>
      </section>
    </MarketingLayout>
  )
}

function ServiceSection({ service, index, isMobile }) {
  const ref = useFadeUp()
  const reversed = index % 2 === 1

  return (
    <section ref={ref} style={{ padding: isMobile ? '48px 20px' : '64px 40px' }}>
      <div style={{
        maxWidth: 960, margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: isMobile ? 24 : 48,
        alignItems: 'center',
      }}>
        {/* Visual card */}
        <div
          className="fade-up d1"
          style={{
            background: service.gradient,
            borderRadius: isMobile ? 16 : 20,
            aspectRatio: isMobile ? '16/10' : '4/3',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            order: isMobile ? 0 : (reversed ? 1 : 0),
          }}
        >
          <div style={{
            background: 'white', borderRadius: 12, padding: '16px 22px',
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            textAlign: 'center',
          }}>
            <ServiceIcon iconKey={service.icon} />
            <div style={{ fontSize: 14, fontWeight: 600, color: '#18181a', marginTop: 8 }}>{service.title}</div>
          </div>
        </div>

        {/* Content */}
        <div className="fade-up d2" style={{ order: isMobile ? 1 : (reversed ? 0 : 1) }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#b8906a', marginBottom: 10 }}>
            {service.title}
          </div>
          <h3 style={{
            fontFamily: '"DM Serif Display", serif',
            fontSize: isMobile ? 24 : 28,
            color: '#18181a', letterSpacing: '-0.8px',
            lineHeight: 1.15, margin: '0 0 12px',
          }}>
            {service.desc.split('.')[0]}.
          </h3>
          <p style={{ fontSize: isMobile ? 15 : 16, color: '#7a7888', lineHeight: 1.65, fontWeight: 300, margin: '0 0 20px' }}>
            {service.desc}
          </p>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#18181a', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>
            What's included
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {service.includes.map(item => (
              <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#3a3840', fontWeight: 300 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M9 12.75L11.25 15L15 9.75M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#b8906a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

function ServiceIcon({ iconKey }) {
  const common = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: '#b8906a', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (iconKey === 'landing') return <svg {...common}><rect x="3" y="4" width="18" height="14" rx="2" /><path d="M3 9h18" /><circle cx="8" cy="6.5" r="0.7" fill="#b8906a" stroke="none" /><path d="M10 13c1.1-1.2 2.6-1.8 4-1.8 1.4 0 2.9.6 4 1.8" /><path d="M14 11.2v3.8" /></svg>
  if (iconKey === 'website') return <svg {...common}><path d="M4 20V8l8-4 8 4v12" /><path d="M9 20v-6h6v6" /><path d="M8 10h.01M12 10h.01M16 10h.01" /></svg>
  if (iconKey === 'app') return <svg {...common}><circle cx="12" cy="12" r="2.5" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.8 5.8l2.1 2.1M16.1 16.1l2.1 2.1M18.2 5.8l-2.1 2.1M7.9 16.1l-2.1 2.1" /></svg>
  if (iconKey === 'seo') return <svg {...common}><path d="M4 19h16" /><path d="M7 15l3-3 3 2 4-5" /><path d="M17 9h3v3" /></svg>
  if (iconKey === 'security') return <svg {...common}><path d="M12 3l7 3v6c0 5-3.5 8.5-7 9-3.5-.5-7-4-7-9V6l7-3z" /><path d="M9.5 12.5l2 2 3-3.5" /></svg>
  return <svg {...common}><path d="M4 14v-1a8 8 0 0116 0v1" /><rect x="3" y="14" width="4" height="6" rx="1.5" /><rect x="17" y="14" width="4" height="6" rx="1.5" /><path d="M12 20v1" /></svg>
}
```

**Step 2: Verify & Commit**

Navigate to `/services`, verify all 6 services render with alternating layout, comparison section still shows, CTA band at bottom links to `/contact`.

```bash
git add -A && git commit -m "feat: redesign services page with deep-dive sections and CTA band"
```

---

## Task 6: Mobile-First Global Polish

**Files:**
- Modify: `src/components/Hero.jsx`
- Modify: `src/components/Work.jsx`
- Modify: `src/components/Pricing.jsx`

**Step 1: Hero.jsx mobile improvements**

On mobile, hide the `DashboardMockup` and show a simplified trust row instead. Update lines 111-113:

```jsx
// Replace:
<div className="anim-rise-6" style={{ marginTop: isMobile ? 48 : 72, width: '100%', maxWidth: 820 }}>
  <DashboardMockup isMobile={isMobile} />
</div>

// With:
{!isMobile && (
  <div className="anim-rise-6" style={{ marginTop: 72, width: '100%', maxWidth: 820 }}>
    <DashboardMockup isMobile={false} />
  </div>
)}
```

**Step 2: Work.jsx — horizontal scroll on mobile**

In `Work.jsx`, change the mobile grid to a horizontal scrollable row:

Replace the grid container:
```jsx
// Old:
<div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: isMobile ? 16 : 18, marginTop: isMobile ? 36 : 52 }}>

// New:
<div style={isMobile ? {
  display: 'flex', gap: 14, marginTop: 36,
  overflowX: 'auto', scrollSnapType: 'x mandatory',
  paddingBottom: 8, WebkitOverflowScrolling: 'touch',
} : {
  display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18, marginTop: 52,
}}>
```

And add `minWidth` + `scrollSnapAlign` to each card on mobile:
```jsx
style={{
  // existing styles ...
  minWidth: isMobile ? '85vw' : undefined,
  scrollSnapAlign: isMobile ? 'start' : undefined,
}}
```

Add `className="mobile-scroll"` to the container div on mobile so scrollbars are hidden (already handled in index.css).

**Step 3: Pricing cards mobile padding**

In `Pricing.jsx` `PricingCard`, increase mobile padding:
```jsx
// Old:
padding: isMobile ? '24px 20px' : '30px 26px',
// New:
padding: isMobile ? '28px 24px' : '30px 26px',
```

**Step 4: Verify & Commit**

Check mobile viewport: hero has no dashboard mockup, project cards are swipeable, pricing cards have better spacing.

```bash
git add -A && git commit -m "polish: mobile-first improvements for hero, work carousel, and pricing"
```

---

## Summary of All Files Changed

| Task | Files | Type |
|------|-------|------|
| 1. Retainer rebrand | 6 files | Text replacements |
| 2. Contact page | 3 files (1 new, 2 modified) | New page + route + layout prop |
| 3. CTA link updates | 3 files | href → /contact |
| 4. Mobile nav overlay | 1 file | Rewrite mobile section |
| 5. Services redesign | 1 file | Full rewrite |
| 6. Mobile polish | 3 files | Targeted improvements |

**Total: ~12 files, 6 commits**
