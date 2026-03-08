import { useEffect } from 'react'

const DEFAULT_SITE_NAME = 'VibefoxStudio'
const DEFAULT_DISPLAY_NAME = 'Vibefox Studio'
const DEFAULT_IMAGE = 'https://vibefoxstudio.com/image2vector.svg'
const GLOBAL_KEYWORDS = [
  'vibefoxstudio',
  'vibefox studio',
  'best digital marketing agency in jacksonville florida',
  'jacksonville digital marketing agency',
  'seo agency jacksonville fl',
  'website design jacksonville florida',
  'local seo jacksonville',
]

function upsertMeta(selector, attrs, content) {
  let tag = document.head.querySelector(selector)
  if (!tag) {
    tag = document.createElement('meta')
    Object.entries(attrs).forEach(([k, v]) => tag.setAttribute(k, v))
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

function upsertLink(selector, attrs, href) {
  let tag = document.head.querySelector(selector)
  if (!tag) {
    tag = document.createElement('link')
    Object.entries(attrs).forEach(([k, v]) => tag.setAttribute(k, v))
    document.head.appendChild(tag)
  }
  tag.setAttribute('href', href)
}

function mergeKeywords(customKeywords) {
  const all = [...GLOBAL_KEYWORDS, ...(customKeywords ? customKeywords.split(',') : [])]
  return [...new Set(all.map(item => item.trim().toLowerCase()).filter(Boolean))].join(', ')
}

export default function SEOHead({
  title,
  description,
  path = '/',
  keywords,
  image = DEFAULT_IMAGE,
  type = 'website',
  noindex = false,
  structuredData,
}) {
  useEffect(() => {
    const pageTitle = title || DEFAULT_SITE_NAME
    const canonicalUrl = `https://vibefoxstudio.com${path}`
    const titleHasBrand = [DEFAULT_SITE_NAME, DEFAULT_DISPLAY_NAME].some(brand => pageTitle.includes(brand))
    const fullTitle = titleHasBrand ? pageTitle : `${pageTitle} | ${DEFAULT_SITE_NAME}`

    const defaultOrganizationSchema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': 'https://vibefoxstudio.com/#organization',
      name: DEFAULT_DISPLAY_NAME,
      alternateName: DEFAULT_SITE_NAME,
      url: 'https://vibefoxstudio.com',
      logo: DEFAULT_IMAGE,
      areaServed: 'Jacksonville, Florida',
      description: 'VibefoxStudio is a Jacksonville, Florida digital marketing agency focused on SEO, high-converting websites, and growth systems.',
    }
    const providedSchemas = Array.isArray(structuredData) ? structuredData : (structuredData ? [structuredData] : [])
    const schemas = noindex ? providedSchemas : [defaultOrganizationSchema, ...providedSchemas]

    document.title = fullTitle

    upsertMeta('meta[name="description"]', { name: 'description' }, description)
    upsertMeta('meta[name="robots"]', { name: 'robots' }, noindex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large')
    upsertMeta('meta[name="keywords"]', { name: 'keywords' }, mergeKeywords(keywords))
    upsertMeta('meta[name="author"]', { name: 'author' }, DEFAULT_SITE_NAME)
    upsertMeta('meta[name="application-name"]', { name: 'application-name' }, DEFAULT_SITE_NAME)
    upsertMeta('meta[name="apple-mobile-web-app-title"]', { name: 'apple-mobile-web-app-title' }, DEFAULT_SITE_NAME)
    upsertMeta('meta[name="geo.region"]', { name: 'geo.region' }, 'US-FL')
    upsertMeta('meta[name="geo.placename"]', { name: 'geo.placename' }, 'Jacksonville')

    upsertMeta('meta[property="og:type"]', { property: 'og:type' }, type)
    upsertMeta('meta[property="og:title"]', { property: 'og:title' }, fullTitle)
    upsertMeta('meta[property="og:description"]', { property: 'og:description' }, description)
    upsertMeta('meta[property="og:url"]', { property: 'og:url' }, canonicalUrl)
    upsertMeta('meta[property="og:image"]', { property: 'og:image' }, image)
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name' }, DEFAULT_SITE_NAME)

    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card' }, 'summary_large_image')
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title' }, fullTitle)
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description' }, description)
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image' }, image)

    upsertLink('link[rel="canonical"]', { rel: 'canonical' }, canonicalUrl)

    let schemaScript = document.head.querySelector('script[data-seo-schema="true"]')
    if (schemas.length > 0) {
      if (!schemaScript) {
        schemaScript = document.createElement('script')
        schemaScript.type = 'application/ld+json'
        schemaScript.setAttribute('data-seo-schema', 'true')
        document.head.appendChild(schemaScript)
      }
      schemaScript.textContent = JSON.stringify(schemas.length === 1 ? schemas[0] : schemas)
    } else if (schemaScript) {
      schemaScript.remove()
    }
  }, [title, description, path, keywords, image, type, noindex, structuredData])

  return null
}
