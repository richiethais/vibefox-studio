export const SITE_URL = 'https://www.vibefoxstudio.com'
export const DEFAULT_SITE_NAME = 'VibefoxStudio'
export const DEFAULT_DISPLAY_NAME = 'Vibefox Studio'
export const DEFAULT_IMAGE = `${SITE_URL}/seo-preview.png`
export const DEFAULT_LOGO = `${SITE_URL}/logo-mark.png`
export const MAX_SEO_TITLE_LENGTH = 65

export const GLOBAL_KEYWORDS = [
  'vibefoxstudio',
  'vibefox studio',
  'best digital marketing agency in jacksonville florida',
  'jacksonville digital marketing agency',
  'seo agency jacksonville fl',
  'website design jacksonville florida',
  'local seo jacksonville',
]

export const PUBLIC_ROUTE_SEO = {
  '/': {
    title: 'Jacksonville Web Design & SEO Services | Vibefox Studio',
    description:
      'Build a website that actually works. Vibefox Studio delivers fast, high-converting websites and SEO systems for Jacksonville businesses ready for measurable growth.',
    keywords:
      'best digital marketing agency in jacksonville florida, jacksonville seo agency, website design jacksonville fl, local seo jacksonville, digital marketing jacksonville beach, lead generation agency jacksonville',
  },
  '/services': {
    title: 'Jacksonville SEO Services | Vibefox Studio',
    description:
      'Jacksonville-focused SEO, websites, content strategy, and conversion-focused digital marketing services from Vibefox Studio.',
    keywords:
      'digital marketing services jacksonville florida, seo services jacksonville, web design and seo agency jacksonville, best digital marketing agency in jacksonville florida, local marketing company jacksonville',
  },
  '/work': {
    title: 'Jacksonville Web Design Portfolio | Vibefox Studio',
    description:
      "See real websites and SEO projects we've built for Jacksonville businesses. From restaurants to food trucks, explore our portfolio of live client work.",
    keywords:
      'web design portfolio jacksonville, jacksonville website examples, restaurant website design jacksonville florida, seo project results jacksonville, vibefox studio portfolio',
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
    title: 'Jacksonville SEO Blog | Vibefox Studio',
    description:
      'Weekly blog posts on SEO, local search, conversion optimization, and digital growth for Jacksonville, Florida businesses.',
    keywords:
      'jacksonville digital marketing blog, seo tips jacksonville florida, local seo blog, best digital marketing agency in jacksonville florida',
  },
}

const BLOG_TITLE_OVERRIDES_BY_SLUG = {
  'best-digital-marketing-agency-jacksonville-florida-checklist':
    'Best Jacksonville Marketing Agency Checklist | Vibefox Studio',
  'jacksonville-local-seo-strategy-small-business':
    'Jacksonville Local SEO Strategy for SMBs | Vibefox Studio',
  'seo-blogging-calendar-for-lead-generation':
    'SEO Blog Calendar for Qualified Leads | Vibefox Studio',
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
    slogan: 'Jacksonville Web Design & SEO Services',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Jacksonville',
      addressRegion: 'FL',
      addressCountry: 'US',
    },
    description: PUBLIC_ROUTE_SEO['/'].description,
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
