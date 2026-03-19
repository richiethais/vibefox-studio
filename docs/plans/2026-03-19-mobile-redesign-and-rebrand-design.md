# VibeFox Studio — Mobile Redesign, Contact Page, Retainer Rebrand, Services Redesign

**Date:** 2026-03-19
**Status:** Approved

---

## 1. Navigation & Contact Restructure

### New `/contact` route
- Dedicated contact page replaces `/#contact` as the primary CTA destination
- Hero: "Let's build something great." with response time subtitle
- Left column: existing form (name, email, service dropdown, budget, message) reusing Supabase submission
- Right column: trust signals — "Typically reply within 24 hours", testimonial quote, "Jacksonville, FL" location badge
- Existing `Contact` section component stays on homepage/other pages, but nav CTA and "Get in touch" buttons route to `/contact`

### Desktop nav
- "Get in touch" button changes from `href="/#contact"` to `<Link to="/contact">`

### Mobile nav — full-screen overlay
- Hamburger opens full-screen overlay with `AnimatePresence` from Framer Motion
- Background: blurred frosted glass (`backdrop-filter: blur(24px)`)
- Logo top-left, X close top-right
- Nav links centered vertically, large (24px+), staggered fade-in (50ms delay each)
- "Get in touch" prominent button at bottom
- Body scroll locked when open

### Mobile nav bar additions
- "Contact" pill button to the left of hamburger — routes directly to `/contact`
- Layout: `[Logo] ---- [Contact pill] [Hamburger]`

---

## 2. "Retainer" → "Growth Plan" Rebrand

Global replacement across 6 files:

| File | Current | New |
|------|---------|-----|
| Pricing.jsx | "Retainer plans" | "Growth Plans" |
| Contact.jsx | Service option: "Retainer" | "Growth Plan" |
| Hero.jsx | "Retainers available" | "Growth plans available" |
| Hero.jsx | "Retainer renewal" | "Plan renewal" |
| FAQ.jsx | 3x "retainer" references | "growth plan" |
| HowItWorks.jsx | "Your retainer keeps everything running" | "Your growth plan keeps everything running" |
| PricingPage.jsx | SEO keyword with "retainer" | "growth plan" |

---

## 3. Services Page — Complete Redesign

**Remove:** Current layout (PageHero + Services grid + Testimonial + Contact)

**New layout:**

1. **Hero** — "Everything your business needs to grow online." Single CTA to `/contact`
2. **Service deep-dives** — 6 alternating sections (left/right on desktop, stacked on mobile)
   - Service name + SVG icon
   - 2-3 sentence description
   - 3-4 "What's included" bullets
   - Subtle gradient background card
   - Desktop: content left / visual right, alternating. Mobile: stacked
3. **Comparison** — Keep existing component as-is
4. **CTA band** — "Ready to get started?" routing to `/contact`
5. **No testimonial or contact form** — keep focused, CTA routes to `/contact`

---

## 4. Mobile-First Redesign (Global)

### Spacing & typography
- Section padding: `72px 20px` (from `80px 18px`)
- Body text minimum 16px (some places currently 13-15px)
- Subheadings minimum 14-15px (some currently 11px)

### Hero on mobile
- Reduce heading size for better wrapping
- Stack CTAs vertically
- Remove dashboard mockup (unreadable at mobile size) — replace with trust badge row

### Project cards on mobile
- Horizontal swipeable carousel instead of stacked vertical cards

### Pricing on mobile
- Full-width stacked cards with more padding
- Larger toggle touch target

### General mobile
- Rounded corners 14px (vs 16px desktop) for proportion
- Softer shadows
- All interactive elements minimum 44px touch target
