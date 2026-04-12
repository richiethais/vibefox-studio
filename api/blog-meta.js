import { getMergedPublishedPostBySlug } from '../src/lib/publishedPosts.js'
import {
  DEFAULT_IMAGE,
  SITE_URL,
  getBlogPostSeo,
  getLocalBusinessSchema,
  getPublicRouteSeo,
  mergeKeywords,
} from '../src/lib/publicSeo.js'

export const config = { runtime: 'edge' }

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildStructuredData(post) {
  if (!post) return getLocalBusinessSchema()
  const seo = getBlogPostSeo(post)
  return [getLocalBusinessSchema(), seo.structuredData]
}

function renderBlogMetaPage(post) {
  const seo = post ? getBlogPostSeo(post) : getPublicRouteSeo('/blogs')
  const canonical = seo.path === '/' ? `${SITE_URL}/` : `${SITE_URL}${seo.path}`
  const image = seo.image || DEFAULT_IMAGE
  const description = seo.description
  const bodyTitle = post?.title || 'Vibefox Studio Blog'
  const bodyCopy = post?.excerpt || 'Browse SEO and digital marketing insights from Vibefox Studio.'
  const bodyContent = post?.content
    ? `<article><h1>${escapeHtml(bodyTitle)}</h1><p>${escapeHtml(description)}</p></article>`
    : `<main><h1>${escapeHtml(bodyTitle)}</h1><p>${escapeHtml(bodyCopy)}</p></main>`

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <link rel="canonical" href="${canonical}" />
    <meta name="robots" content="index,follow,max-image-preview:large" />
    <meta property="og:type" content="${escapeHtml(seo.type || 'website')}" />
    <meta property="og:title" content="${escapeHtml(seo.title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(seo.title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />
    <title>${escapeHtml(seo.title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="keywords" content="${escapeHtml(mergeKeywords(seo.keywords))}" />
    <script type="application/ld+json">${JSON.stringify(buildStructuredData(post))}</script>
  </head>
  <body style="margin:0;padding:40px;background:#f5f3f0;color:#18181a;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    ${bodyContent}
  </body>
</html>`
}

const htmlResponse = html => new Response(html, {
  headers: { 'Content-Type': 'text/html; charset=utf-8' },
})

export default async function handler(request) {
  const url = new URL(request.url)
  const slug = url.searchParams.get('slug')

  if (!slug) {
    return htmlResponse(renderBlogMetaPage(null))
  }

  const post = await getMergedPublishedPostBySlug(slug, {
    supabaseUrl: process.env.VITE_SUPABASE_URL,
    supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY,
    fetchImpl: fetch,
  })

  return htmlResponse(renderBlogMetaPage(post))
}
