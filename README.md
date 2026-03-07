# Vibefox Studio

Website for Vibefox Studio — fast, modern websites and custom apps for small businesses.

## Stack

- **React** — component-based UI
- **Vite** — fast dev server and build tool
- **Tailwind CSS** — utility-first styling
- **DM Serif Display + DM Sans** — typography

## Structure

```
src/
  components/
    Nav.jsx          # Fixed pill navigation
    Hero.jsx         # Hero section + dashboard mockup
    LogoStrip.jsx    # Client logo strip
    Services.jsx     # Services grid (6 cards)
    HowItWorks.jsx   # 3-step process
    Work.jsx         # Portfolio / project cards
    Comparison.jsx   # Dark comparison table
    Pricing.jsx      # 3-tier pricing cards
    Testimonial.jsx  # Client testimonial
    FAQ.jsx          # Accordion FAQ
    CTAFooter.jsx    # CTA block + footer
    useFadeUp.js     # Scroll animation hook
  App.jsx            # Root component
  index.css          # Global styles + Tailwind
```

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy

Push to GitHub and connect to Vercel. Auto-deploys on every push to `main`.
