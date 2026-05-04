# City Landing Pages - Design Document

## Goal

Create programmatic SEO landing pages for ~40+ US cities at `/{city}-digital-marketing-agency/`. These pages are discovered via search only (no nav links) and drive leads to the contact page.

## URL Pattern

`/{city}-digital-marketing-agency/` (e.g., `/jacksonville-digital-marketing-agency/`)

## Architecture

### Data-driven template approach

- **One React component**: `src/pages/marketing/CityLandingPage.jsx`
- **One data file**: `src/data/cities.js` — array of city objects
- **One dynamic route**: `/:citySlug-digital-marketing-agency` in `PublicRoutes.jsx`

### City data shape

```js
{
  slug: 'jacksonville',
  name: 'Jacksonville',
  state: 'FL',
  stateFullName: 'Florida',
  tagline: 'Digital marketing that ranks & converts.',
  description: 'Custom description for the city...',
  image: '/cities/jacksonville.jpg',
  neighborhoods: ['Riverside', 'Southside', 'San Marco', 'Ponte Vedra'],
}
```

Process steps and FAQ questions use sensible defaults with city name interpolation. Per-city overrides are optional.

## Page Template Sections

| Section | Content |
|---------|---------|
| **Hero** | Trust bar (5-star, reviews count), `// {City} Digital Marketing Agency` eyebrow, H1 with city + tagline, description paragraph, CTA button to `/contact` |
| **Stats bar** | 4 stats: years experience, projects delivered, client rating, turnaround time |
| **Services overview** | What Vibefox offers (web design, SEO, meta ads, content) — NO pricing |
| **Process** | 4-5 numbered steps (default set, customizable per city) |
| **Testimonial / social proof** | Shared testimonials across cities |
| **FAQ** | 4-5 city-specific questions with city name interpolated |
| **CTA** | "Get your free {City} digital marketing proposal" with button to `/contact` |

## SEO Per City (auto-generated)

- **Title**: `{City} Digital Marketing Agency | Vibefox Studio`
- **Description**: Generated from city data
- **Keywords**: `digital marketing agency {city}, {city} web design, seo services {city} {state}, ...`
- **Canonical URL**: `https://www.vibefoxstudio.com/{slug}-digital-marketing-agency`
- **Structured data**: LocalBusiness + Service schema with city info
- **Geo meta tags**: `geo.region`, `geo.placename`

## Pages to Remove

- `/web-design-jacksonville-fl` — delete page component + route + SEO entry
- `/seo-services-jacksonville-fl` — delete page component + route + SEO entry
- Add 301 redirects in `vercel.json` for both old URLs to `/jacksonville-digital-marketing-agency/`

## What Stays the Same

- Homepage (`/`) — unchanged, keeps general pitch
- Nav — no city links added
- All other pages — untouched

## Sitemap & Prerender

- Update `scripts/generate-sitemap.mjs` to include all city slugs
- Update `scripts/prerender-meta.mjs` to prerender city pages

## Starting City List (~40 cities)

### From lead list
Jacksonville FL, Houston TX, San Antonio TX, El Paso TX, Chicago IL, Denver CO, San Diego CA, Detroit MI, Pittsburgh PA, Fort Wayne IN, Tucson AZ, Sarasota FL, Mobile AL, Macon GA, Valdosta GA, Grand Rapids MI, Sioux Falls SD, Lincoln NE, Wichita Falls TX, Cedar Rapids IA, Lake Charles LA, Athens GA

### Strategic additions
Atlanta GA, Tampa FL, Orlando FL, Miami FL, Dallas TX, Austin TX, Nashville TN, Charlotte NC, Raleigh NC, Phoenix AZ, Las Vegas NV, Columbus OH, Indianapolis IN, St. Louis MO, Kansas City MO, Minneapolis MN, Birmingham AL, Savannah GA, New Orleans LA
