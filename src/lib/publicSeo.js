import { cities } from '../data/cities.js'

export const SITE_URL = 'https://www.vibefoxstudio.com'
export const DEFAULT_SITE_NAME = 'VibefoxStudio'
export const DEFAULT_DISPLAY_NAME = 'Vibefox Studio'
export const DEFAULT_IMAGE = `${SITE_URL}/seo-preview.png`
export const DEFAULT_LOGO = `${SITE_URL}/logo-mark.png`
export const MAX_SEO_TITLE_LENGTH = 65

export const GLOBAL_KEYWORDS = [
  'vibefoxstudio',
  'vibefox studio',
  'digital marketing agency',
  'web design company',
  'seo services',
  'local seo',
  'website design',
]

export const PUBLIC_ROUTE_SEO = {
  '/': {
    title: 'Jacksonville Web Design & SEO Company | Vibefox Studio',
    description:
      'Vibefox Studio is a Jacksonville web design and SEO company. We build fast, high-converting websites and local SEO systems for Jacksonville, FL businesses ready to grow.',
    keywords:
      'jacksonville web design company, web design jacksonville fl, seo services jacksonville fl, jacksonville seo company, local seo jacksonville, website design jacksonville florida, digital marketing jacksonville',
  },
  '/services': {
    title: 'Web Design & SEO Services Jacksonville FL | Vibefox Studio',
    description:
      'Full-service web design, local SEO, custom web apps, and ongoing support for Jacksonville, FL businesses. Transparent pricing, fast delivery, real results.',
    keywords:
      'web design services jacksonville fl, seo services jacksonville florida, jacksonville web design agency, local seo services jacksonville, digital marketing services jacksonville florida',
  },
  '/work': {
    title: 'Our Work: Jacksonville Web Design Portfolio | Vibefox Studio',
    description:
      "Explore our work for Jacksonville businesses, including restaurant websites, food truck sites, and SEO-focused builds designed to turn visits into leads.",
    keywords:
      'our work, web design portfolio jacksonville, jacksonville website examples, restaurant website design jacksonville florida, seo project results jacksonville, vibefox studio portfolio',
  },
  '/pricing': {
    title: 'Jacksonville SEO Pricing | Vibefox Studio',
    description:
      'Transparent monthly digital marketing and SEO pricing for Jacksonville businesses. Flexible plans for websites, content, and ongoing growth from Vibefox Studio.',
    keywords:
      'digital marketing pricing jacksonville florida, seo packages jacksonville, website maintenance plans, jacksonville digital marketing growth plan',
  },
  '/faq': {
    title: 'Jacksonville SEO FAQ | Vibefox Studio',
    description:
      'Answers to common SEO, website, and digital marketing questions for Jacksonville businesses evaluating agency partners.',
    keywords:
      'digital marketing faq jacksonville florida, seo agency questions, jacksonville marketing support, best digital marketing agency in jacksonville florida',
  },
  '/contact': {
    title: 'Contact Vibefox Studio | Jacksonville Marketing',
    description: 'Get in touch with Vibefox Studio. We typically respond within 24 hours.',
    keywords:
      'contact jacksonville digital marketing agency, web design inquiry jacksonville florida',
  },
  '/blogs': {
    title: 'Jacksonville SEO Blogs | Vibefox Studio',
    description:
      'Browse our SEO blogs for Jacksonville businesses, with practical guidance on local search, content strategy, website performance, and digital growth.',
    keywords:
      'jacksonville seo blogs, digital marketing blogs jacksonville florida, seo tips jacksonville florida, local seo blogs, best digital marketing agency in jacksonville florida',
  },
  '/privacy-policy': {
    title: 'Privacy Policy | Vibefox Studio',
    description:
      'Read the Vibefox Studio Privacy Policy for details about data collection, client portal information, payments, cookies, storage, and privacy choices.',
    keywords:
      'vibefox studio privacy policy, website privacy policy, client portal privacy',
  },
  '/terms-of-service': {
    title: 'Terms of Service | Vibefox Studio',
    description:
      'Read the Vibefox Studio Terms of Service for website use, project services, client responsibilities, payments, intellectual property, and limitations.',
    keywords:
      'vibefox studio terms of service, website terms, service terms',
  },
  '/cookie-policy': {
    title: 'Cookie Policy | Vibefox Studio',
    description:
      'Read the Vibefox Studio Cookie Policy for information about essential cookies, browser storage, authentication, and future tracking updates.',
    keywords:
      'vibefox studio cookie policy, cookie notice, browser storage',
  },
  '/refund-policy': {
    title: 'Refund & Cancellation Policy | Vibefox Studio',
    description:
      'Read the Vibefox Studio Refund and Cancellation Policy for project work, monthly services, coaching sessions, and third-party costs.',
    keywords:
      'vibefox studio refund policy, cancellation policy, coaching refunds',
  },
  '/accessibility': {
    title: 'Accessibility Statement | Vibefox Studio',
    description:
      'Read the Vibefox Studio Accessibility Statement and learn how to report accessibility barriers on the website or client experience.',
    keywords:
      'vibefox studio accessibility statement, website accessibility',
  },
  '/disclaimer': {
    title: 'Website Disclaimer | Vibefox Studio',
    description:
      'Read the Vibefox Studio Website Disclaimer for information about marketing content, third-party links, testimonials, and results.',
    keywords:
      'vibefox studio disclaimer, website disclaimer, marketing results disclaimer',
  },
}

const BLOG_TITLE_OVERRIDES_BY_SLUG = {
  'best-digital-marketing-agency-jacksonville-florida-checklist':
    'Best Jacksonville Marketing Agency Checklist | Vibefox Studio',
  'jacksonville-local-seo-strategy-small-business':
    'Jacksonville Local SEO Strategy for SMBs | Vibefox Studio',
  'seo-blogging-calendar-for-lead-generation':
    'SEO Blog Calendar for Qualified Leads | Vibefox Studio',
  'restaurant-seo-guide-2026':
    'Restaurant SEO Guide for 2026 | Vibefox Studio',
  'website-speed-and-conversion-optimization-jacksonville':
    'Jacksonville Speed & Conversion Tips | Vibefox Studio',
}

function dedupeKeywordList(list) {
  return [...new Set(list.map(item => item.trim().toLowerCase()).filter(Boolean))]
}

function stripBrandSuffix(title) {
  return String(title || '')
    .replace(/\s+\|\s+vibefoxstudio$/i, '')
    .replace(/\s+\|\s+vibefox studio$/i, '')
    .trim()
}

function truncateAtWordBoundary(value, maxLength) {
  const trimmed = String(value || '').trim()
  if (!trimmed || trimmed.length <= maxLength) return trimmed

  const slice = trimmed.slice(0, maxLength + 1)
  const boundary = Math.max(slice.lastIndexOf(' '), slice.lastIndexOf('-'), slice.lastIndexOf(':'))
  const safe = (boundary > Math.max(12, Math.floor(maxLength * 0.55)) ? slice.slice(0, boundary) : slice.slice(0, maxLength)).trim()
  return safe.replace(/[,:;\-–\s]+$/g, '').trim()
}

export function mergeKeywords(customKeywords) {
  return dedupeKeywordList([
    ...GLOBAL_KEYWORDS,
    ...(customKeywords ? String(customKeywords).split(',') : []),
  ]).join(', ')
}

export function buildSeoTitle(baseTitle, { maxLength = MAX_SEO_TITLE_LENGTH } = {}) {
  const suffix = ` | ${DEFAULT_DISPLAY_NAME}`
  const cleanBase = stripBrandSuffix(baseTitle)
  const fullTitle = `${cleanBase}${suffix}`

  if (fullTitle.length <= maxLength) return fullTitle

  const shortenedBase = truncateAtWordBoundary(cleanBase, maxLength - suffix.length)
  return `${shortenedBase}${suffix}`
}

export function getPublicRouteSeo(path) {
  const route = PUBLIC_ROUTE_SEO[path]
  return route ? { ...route, path } : null
}

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

export function getLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_URL}/#localbusiness`,
    name: DEFAULT_SITE_NAME,
    alternateName: DEFAULT_DISPLAY_NAME,
    image: DEFAULT_IMAGE,
    url: SITE_URL,
    areaServed: 'Jacksonville, Florida',
    email: 'inquiries@vibefoxstudio.com',
    slogan: 'Jacksonville Web Design & SEO Company',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Jacksonville',
      addressRegion: 'FL',
      addressCountry: 'US',
    },
    description: PUBLIC_ROUTE_SEO['/'].description,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '5',
      reviewCount: '12',
      bestRating: '5',
    },
  }
}

export function getServicesStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Digital Marketing and Web Development',
    provider: {
      '@type': 'LocalBusiness',
      name: DEFAULT_SITE_NAME,
      alternateName: DEFAULT_DISPLAY_NAME,
      areaServed: 'Jacksonville, Florida',
      url: `${SITE_URL}/services`,
    },
    areaServed: {
      '@type': 'City',
      name: 'Jacksonville',
    },
  }
}

export function getFaqStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How do I choose the best digital marketing agency in Jacksonville, Florida?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Look for a clear SEO strategy, measurable reporting, local market knowledge, and transparent communication cadence.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do you offer ongoing SEO content publishing?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Weekly or monthly blog publishing and on-page optimization are available in growth plans.',
        },
      },
    ],
  }
}

export function getBlogIndexStructuredData(posts = []) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'VibefoxStudio Blogs',
    url: `${SITE_URL}/blogs`,
    blogPost: posts.map(post => ({
      '@type': 'BlogPosting',
      headline: post.title,
      datePublished: post.publishedAt,
      url: `${SITE_URL}/blogs/${post.slug}`,
    })),
  }
}

export function getBlogSeoTitle(title, slug) {
  const override = slug ? BLOG_TITLE_OVERRIDES_BY_SLUG[slug] : null
  if (override) return override
  return buildSeoTitle(title)
}

export function getBlogPostStructuredData(post) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    description: post.excerpt,
    author: {
      '@type': 'Organization',
      name: DEFAULT_SITE_NAME,
    },
    publisher: {
      '@type': 'Organization',
      name: DEFAULT_SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/favicon-512x512.png`,
      },
    },
    mainEntityOfPage: `${SITE_URL}/blogs/${post.slug}`,
  }
}

export function getBlogPostSeo(post) {
  return {
    title: getBlogSeoTitle(post.title, post.slug),
    description: post.excerpt || PUBLIC_ROUTE_SEO['/blogs'].description,
    keywords: post.keywords || PUBLIC_ROUTE_SEO['/blogs'].keywords,
    path: `/blogs/${post.slug}`,
    type: 'article',
    image: post.coverImageUrl || DEFAULT_IMAGE,
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt || post.publishedAt,
    structuredData: getBlogPostStructuredData(post),
  }
}
