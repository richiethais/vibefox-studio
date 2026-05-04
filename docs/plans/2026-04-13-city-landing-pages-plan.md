# City Landing Pages Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create ~40 programmatic SEO city landing pages at `/{city}-digital-marketing-agency` using a single template component powered by a city data file.

**Architecture:** One React page component (`CityLandingPage.jsx`) reads a `:slug` param from the URL, looks up city data from `src/data/cities.js`, and renders a templated landing page. SEO metadata and structured data are auto-generated per city. Existing Jacksonville-specific pages are removed and redirected.

**Tech Stack:** React 19, React Router DOM 7, Framer Motion, inline styles (matching existing codebase patterns), Vite

---

### Task 1: Create the city data file

**Files:**
- Create: `src/data/cities.js`

**Step 1: Create the city data file with all ~41 cities**

Each city object has: `slug`, `name`, `state`, `stateFullName`, `tagline`, `description`, `neighborhoods` (array of 3-5 local areas).

```js
// src/data/cities.js

export const cities = [
  {
    slug: 'jacksonville',
    name: 'Jacksonville',
    state: 'FL',
    stateFullName: 'Florida',
    tagline: 'Digital marketing that actually drives growth.',
    description: 'Vibefox Studio helps Jacksonville businesses stand out online with custom websites, local SEO, and targeted ad campaigns that bring in real customers.',
    neighborhoods: ['Riverside', 'Southside', 'San Marco', 'Ponte Vedra', 'Jacksonville Beach'],
  },
  {
    slug: 'houston',
    name: 'Houston',
    state: 'TX',
    stateFullName: 'Texas',
    tagline: 'Websites and marketing built for Houston businesses.',
    description: 'From Montrose to Katy, we build fast websites and run data-driven marketing campaigns that help Houston businesses grow online.',
    neighborhoods: ['Montrose', 'The Heights', 'Midtown', 'Katy', 'Sugar Land'],
  },
  // ... all ~41 cities following this pattern
]

export function getCityBySlug(slug) {
  return cities.find(c => c.slug === slug) || null
}

export function getAllCitySlugs() {
  return cities.map(c => c.slug)
}
```

Include all cities from the approved list:
- **From leads:** Jacksonville FL, Houston TX, San Antonio TX, El Paso TX, Chicago IL, Denver CO, San Diego CA, Detroit MI, Pittsburgh PA, Fort Wayne IN, Tucson AZ, Sarasota FL, Mobile AL, Macon GA, Valdosta GA, Grand Rapids MI, Sioux Falls SD, Lincoln NE, Wichita Falls TX, Cedar Rapids IA, Lake Charles LA, Athens GA
- **Strategic:** Atlanta GA, Tampa FL, Orlando FL, Miami FL, Dallas TX, Austin TX, Nashville TN, Charlotte NC, Raleigh NC, Phoenix AZ, Las Vegas NV, Columbus OH, Indianapolis IN, St. Louis MO, Kansas City MO, Minneapolis MN, Birmingham AL, Savannah GA, New Orleans LA

Each city needs a unique tagline, a 1-2 sentence description mentioning the city name, and 3-5 real neighborhoods/suburbs.

**Step 2: Verify the file exports correctly**

Run: `node -e "import('./src/data/cities.js').then(m => console.log(m.cities.length, 'cities loaded'))"`

Expected: `41 cities loaded`

**Step 3: Commit**

```bash
git add src/data/cities.js
git commit -m "feat: add city data file for programmatic landing pages"
```

---

### Task 2: Create the CityLandingPage template component

**Files:**
- Create: `src/pages/marketing/CityLandingPage.jsx`

**Step 1: Build the template component**

Model this after the existing `WebDesignJacksonvillePage.jsx` (same styling patterns, inline styles, `useIsMobile`, `useFadeUp`, `MarketingLayout`). Key differences:

- Reads `slug` from `useParams()` — extracts city slug from URL pattern `/:slug-digital-marketing-agency`
- Looks up city from `getCityBySlug(slug)`
- Shows a 404-style message if city not found
- **NO pricing anywhere** — services section shows what you offer, not what it costs
- All copy interpolates city name dynamically

**Template sections (in order):**

1. **Hero** — Trust bar (stars + "100+ Client Reviews"), eyebrow `// {City} Digital Marketing Agency`, H1: `{City} Digital Marketing Agency` with italic accent on tagline, description paragraph, CTA button "Get Your Free Proposal" linking to `/contact`, secondary "View Our Work" linking to `/work`

2. **Stats bar** — Dark background, 4 stats: `100+` Client Reviews, `5.0` Average Rating, `1-2 wk` Typical Delivery, `100%` Custom Built

3. **Services overview** — Eyebrow "What We Do", H2 "{City} digital marketing for every stage of your business.", 4 service cards (NO prices):
   - Web Design — "Custom websites built to convert visitors into customers"
   - SEO & Local Search — "Rank higher on Google in {city} searches"
   - Meta Ads & PPC — "Targeted ad campaigns that drive real leads"
   - Content & Strategy — "Blog posts, social content, and growth strategy"
   Each card: title, description, 4-5 bullet points, CTA "Get a free proposal" to `/contact`

4. **Why Vibefox** — Two-column: left side with H2 "Built by people who understand {city}'s market." + description mentioning neighborhoods + CTA. Right side: 6 feature checklist cards (same as existing page but with city name swapped in where relevant)

5. **Testimonial** — Shared across all cities (Olympia Cafe testimonial from existing page)

6. **Process** — Eyebrow "How It Works", H2 "Your {city} digital marketing, live in 1-2 weeks.", 3 process cards: Discovery Call, We Design & Build, Launch & Grow

7. **FAQ** — Eyebrow "FAQ", H2 "Common questions about {city} digital marketing.", 5 questions with city name interpolated:
   - "How much does digital marketing cost in {city}, {state}?"
   - "How long does it take to build a website?"
   - "Will my {city} business rank on Google?"
   - "Do you work with small businesses in {city}?"
   - "What happens after the website launches?"

8. **CTA** — Dark background, "Get a free {city} digital marketing proposal today." with gold CTA button to `/contact`

**Styling must match existing patterns exactly:**
- Same fonts: `'DM Serif Display', serif` for headings
- Same colors: `#18181a` (dark), `#b8906a`/`#c8a97e` (gold), `#7a7888` (muted), `#f5f3f0`/`#faf9f7` (backgrounds)
- Same border radius, padding, hover effects
- Same `MarketingLayout` wrapper with `hideCTA` prop (page has its own CTA)
- Same fade-up animations

```jsx
import { useParams, Link } from 'react-router-dom'
import SEOHead from '../../components/SEOHead'
import MarketingLayout from '../../components/marketing/MarketingLayout'
import useIsMobile from '../../components/useIsMobile'
import { useFadeUp } from '../../components/useFadeUp'
import { getCityBySlug } from '../../data/cities'
import { SITE_URL, DEFAULT_DISPLAY_NAME } from '../../lib/publicSeo'

export default function CityLandingPage() {
  const params = useParams()
  // URL is /:slug-digital-marketing-agency, so we need to extract the city slug
  const rawSlug = params['*'] || params.citySlug || ''
  const citySlug = rawSlug.replace(/-digital-marketing-agency$/, '')
  const city = getCityBySlug(citySlug)
  const isMobile = useIsMobile()
  const heroRef = useFadeUp()

  if (!city) {
    return (
      <MarketingLayout>
        <div style={{ textAlign: 'center', padding: '200px 20px' }}>
          <h1>Page not found</h1>
        </div>
      </MarketingLayout>
    )
  }

  const path = `/${city.slug}-digital-marketing-agency`
  const seoTitle = `${city.name} Digital Marketing Agency | ${DEFAULT_DISPLAY_NAME}`
  const seoDescription = city.description
  const seoKeywords = `digital marketing agency ${city.name.toLowerCase()}, ${city.name.toLowerCase()} web design, seo services ${city.name.toLowerCase()} ${city.state.toLowerCase()}, web design ${city.name.toLowerCase()} ${city.state.toLowerCase()}, digital marketing ${city.name.toLowerCase()} ${city.stateFullName.toLowerCase()}`

  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: `Digital Marketing Agency ${city.name} ${city.state}`,
      serviceType: 'Digital Marketing',
      provider: {
        '@type': 'LocalBusiness',
        name: DEFAULT_DISPLAY_NAME,
        url: SITE_URL,
      },
      areaServed: {
        '@type': 'City',
        name: city.name,
        containedInPlace: { '@type': 'State', name: city.stateFullName },
      },
      url: `${SITE_URL}${path}`,
      description: seoDescription,
    },
    // FAQPage schema with the 5 FAQ questions
  ]

  return (
    <MarketingLayout hideCTA>
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        path={path}
        appendBrand={false}
        keywords={seoKeywords}
        structuredData={structuredData}
      />
      {/* All 8 sections as described above */}
    </MarketingLayout>
  )
}
```

**Step 2: Verify it renders without errors locally**

Run: `npm run dev` and navigate to `http://localhost:5173/jacksonville-digital-marketing-agency`

Expected: Full page renders with Jacksonville data, all sections visible, no console errors

**Step 3: Commit**

```bash
git add src/pages/marketing/CityLandingPage.jsx
git commit -m "feat: add CityLandingPage template component"
```

---

### Task 3: Add routing for city pages

**Files:**
- Modify: `src/routes/PublicRoutes.jsx`

**Step 1: Add the dynamic city route and remove old Jacksonville routes**

```jsx
// Add import at top:
import CityLandingPage from '../pages/marketing/CityLandingPage.jsx'

// Remove these two imports:
// import WebDesignJacksonvillePage from '../pages/marketing/WebDesignJacksonvillePage.jsx'
// import SeoServicesJacksonvillePage from '../pages/marketing/SeoServicesJacksonvillePage.jsx'

// Remove these two routes:
// <Route path="/web-design-jacksonville-fl" element={<WebDesignJacksonvillePage />} />
// <Route path="/seo-services-jacksonville-fl" element={<SeoServicesJacksonvillePage />} />

// Add the new dynamic route (BEFORE the catch-all blog redirect):
<Route path="/:citySlug-digital-marketing-agency" element={<CityLandingPage />} />
```

Note: The `:citySlug` param will contain the city slug portion. The component strips `-digital-marketing-agency` suffix. React Router should match this pattern — if not, use a wildcard and parse manually.

**Important:** Since React Router v7 may not support hyphenated dynamic segments like `/:citySlug-digital-marketing-agency`, an alternative approach may be needed. Options:
- Use a catch-all `/*` route at the bottom and have `CityLandingPage` check if the path matches the pattern
- Or use a route like `/:path` and check if it ends with `-digital-marketing-agency` inside the component

Test whichever approach works with React Router 7.

**Step 2: Verify routing works**

Run: `npm run dev`
- Navigate to `/jacksonville-digital-marketing-agency` — should show city page
- Navigate to `/atlanta-digital-marketing-agency` — should show city page
- Navigate to `/services` — should still work (existing routes)
- Navigate to `/nonexistent-digital-marketing-agency` — should show "Page not found"

**Step 3: Commit**

```bash
git add src/routes/PublicRoutes.jsx
git commit -m "feat: add dynamic city landing page route, remove old Jacksonville routes"
```

---

### Task 4: Update SEO infrastructure

**Files:**
- Modify: `src/lib/publicSeo.js`
- Modify: `scripts/generate-sitemap.mjs`
- Modify: `scripts/prerender-meta.mjs`

**Step 1: Clean up publicSeo.js**

Remove the old Jacksonville-specific entries and schemas:

- Remove `/web-design-jacksonville-fl` entry from `PUBLIC_ROUTE_SEO`
- Remove `/seo-services-jacksonville-fl` entry from `PUBLIC_ROUTE_SEO`
- Remove `getWebDesignJaxSchema()` function
- Remove `getSeoJaxSchema()` function
- Add a new helper function for city page SEO:

```js
import { cities } from '../data/cities.js'

export function getCityPageSeo(citySlug) {
  const city = cities.find(c => c.slug === citySlug)
  if (!city) return null
  const path = `/${city.slug}-digital-marketing-agency`
  return {
    title: `${city.name} Digital Marketing Agency | ${DEFAULT_DISPLAY_NAME}`,
    description: city.description,
    keywords: `digital marketing agency ${city.name.toLowerCase()}, ${city.name.toLowerCase()} web design, seo services ${city.name.toLowerCase()} ${city.state.toLowerCase()}, web design ${city.name.toLowerCase()} ${city.state.toLowerCase()}`,
    path,
  }
}

export function getCityStructuredData(citySlug) {
  const city = cities.find(c => c.slug === citySlug)
  if (!city) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `Digital Marketing Agency ${city.name} ${city.state}`,
    serviceType: 'Digital Marketing',
    provider: {
      '@type': 'LocalBusiness',
      name: DEFAULT_DISPLAY_NAME,
      url: SITE_URL,
    },
    areaServed: {
      '@type': 'City',
      name: city.name,
      containedInPlace: { '@type': 'State', name: city.stateFullName },
    },
    url: `${SITE_URL}/${city.slug}-digital-marketing-agency`,
    description: city.description,
  }
}
```

Also update `GLOBAL_KEYWORDS` — remove the Jacksonville-only keywords and make them more general:
```js
export const GLOBAL_KEYWORDS = [
  'vibefoxstudio',
  'vibefox studio',
  'digital marketing agency',
  'web design company',
  'seo services',
  'local seo',
  'website design',
]
```

**Step 2: Update sitemap generation**

In `scripts/generate-sitemap.mjs`:

```js
// Add import:
import { cities } from '../src/data/cities.js'

// Remove old Jacksonville routes from staticRoutes:
// { path: '/web-design-jacksonville-fl', ... },
// { path: '/seo-services-jacksonville-fl', ... },

// After staticRoutes, generate city routes:
const cityRoutes = cities.map(city => ({
  path: `/${city.slug}-digital-marketing-agency`,
  changefreq: 'monthly',
  priority: '0.85',
}))

// In buildXml call, combine:
const xml = buildXml([...staticRoutes, ...cityRoutes], blogEntries)

// Update the log line to include city count:
console.log(`[sitemap] Generated ${staticRoutes.length + cityRoutes.length + blogEntries.length} URLs (${cityRoutes.length} city, ${blogEntries.length} blog)`)
```

**Step 3: Update prerender script**

In `scripts/prerender-meta.mjs`:

```js
// Add imports:
import { cities } from '../src/data/cities.js'
import { getCityPageSeo, getCityStructuredData } from '../src/lib/publicSeo.js'

// After the blog post prerendering loop, add city page prerendering:
for (const city of cities) {
  const cityPath = `/${city.slug}-digital-marketing-agency`
  const seo = getCityPageSeo(city.slug)
  const appHtml = renderPublicApp({ url: cityPath })
  const html = replaceMeta(
    injectAppHtml(template, appHtml),
    seo,
    [getLocalBusinessSchema(), getCityStructuredData(city.slug)],
  )
  const outputPath = path.join(DIST_DIR, `${city.slug}-digital-marketing-agency`, 'index.html')
  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, html, 'utf8')
  console.log(`[prerender] ${cityPath}`)
}
```

Update the final log line to include city count.

**Step 4: Commit**

```bash
git add src/lib/publicSeo.js scripts/generate-sitemap.mjs scripts/prerender-meta.mjs
git commit -m "feat: update SEO infrastructure for city landing pages"
```

---

### Task 5: Add redirects and clean up old files

**Files:**
- Modify: `vercel.json`
- Delete: `src/pages/marketing/WebDesignJacksonvillePage.jsx`
- Delete: `src/pages/marketing/SeoServicesJacksonvillePage.jsx`

**Step 1: Add redirects in vercel.json**

Add these to the `redirects` array:

```json
{ "source": "/web-design-jacksonville-fl", "destination": "/jacksonville-digital-marketing-agency", "permanent": true },
{ "source": "/seo-services-jacksonville-fl", "destination": "/jacksonville-digital-marketing-agency", "permanent": true }
```

Also add rewrites for city pages. Since there are ~41 cities, add a catch-all pattern OR individual rewrites. The existing catch-all `"source": "/(.*)", "destination": "/index.html"` at the bottom should handle SPA routing, but for prerendered pages we need explicit rewrites:

```json
{ "source": "/:slug-digital-marketing-agency", "destination": "/:slug-digital-marketing-agency/index.html" }
```

Add this rewrite BEFORE the catch-all `/(.*) -> /index.html` entry.

**Step 2: Delete old page files**

```bash
rm src/pages/marketing/WebDesignJacksonvillePage.jsx
rm src/pages/marketing/SeoServicesJacksonvillePage.jsx
```

**Step 3: Verify no broken imports**

Run: `grep -r "WebDesignJacksonville\|SeoServicesJacksonville" src/`

Expected: No results (the route imports were already removed in Task 3)

**Step 4: Commit**

```bash
git add vercel.json
git rm src/pages/marketing/WebDesignJacksonvillePage.jsx src/pages/marketing/SeoServicesJacksonvillePage.jsx
git commit -m "chore: add redirects for old Jacksonville pages, delete old page files"
```

---

### Task 6: Build verification and smoke test

**Step 1: Run the dev server and test several city pages**

Run: `npm run dev`

Test these URLs:
- `/jacksonville-digital-marketing-agency` — Jacksonville page loads
- `/atlanta-digital-marketing-agency` — Atlanta page loads  
- `/houston-digital-marketing-agency` — Houston page loads
- `/fake-city-digital-marketing-agency` — Shows "Page not found"
- `/` — Homepage still works
- `/services` — Services page still works
- `/contact` — Contact page still works

For each city page, verify:
- H1 contains city name
- Eyebrow says `// {City} Digital Marketing Agency`
- Description mentions city
- No pricing anywhere on the page
- CTA buttons link to `/contact`
- Mobile responsive (resize browser)
- No console errors

**Step 2: Run the build**

Run: `npm run build`

Expected: Build succeeds. Check that sitemap includes city URLs:

```bash
grep "digital-marketing-agency" dist/sitemap.xml | head -5
```

Expected: Lines like `<loc>https://www.vibefoxstudio.com/jacksonville-digital-marketing-agency</loc>`

**Step 3: Verify prerendered pages exist**

```bash
ls dist/jacksonville-digital-marketing-agency/index.html
ls dist/atlanta-digital-marketing-agency/index.html
```

Expected: Both files exist

**Step 4: Check prerendered SEO meta tags**

```bash
head -20 dist/jacksonville-digital-marketing-agency/index.html
```

Expected: Title tag contains "Jacksonville Digital Marketing Agency | Vibefox Studio", meta description contains Jacksonville-specific text

**Step 5: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: address build/prerender issues for city pages"
```
