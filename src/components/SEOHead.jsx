import { useEffect } from 'react'

const DEFAULT_SITE_NAME = 'Vibefox Studio'
const DEFAULT_IMAGE = 'https://vibefoxstudio.com/image2vector.svg'

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
    const canonicalUrl = `https://vibefoxstudio.com${path}`
    const fullTitle = title.includes(DEFAULT_SITE_NAME) ? title : `${title} | ${DEFAULT_SITE_NAME}`

    document.title = fullTitle

    upsertMeta('meta[name="description"]', { name: 'description' }, description)
    upsertMeta('meta[name="robots"]', { name: 'robots' }, noindex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large')
    upsertMeta('meta[name="keywords"]', { name: 'keywords' }, keywords || '')

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
    if (structuredData) {
      if (!schemaScript) {
        schemaScript = document.createElement('script')
        schemaScript.type = 'application/ld+json'
        schemaScript.setAttribute('data-seo-schema', 'true')
        document.head.appendChild(schemaScript)
      }
      schemaScript.textContent = JSON.stringify(structuredData)
    } else if (schemaScript) {
      schemaScript.remove()
    }
  }, [title, description, path, keywords, image, type, noindex, structuredData])

  return null
}
