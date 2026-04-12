import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import {
  getMergedPublishedPosts,
  getRelatedPublishedPosts,
} from '../src/lib/publishedPosts.js'
import {
  DEFAULT_IMAGE,
  SITE_URL,
  getBlogIndexStructuredData,
  getBlogPostSeo,
  getFaqStructuredData,
  getLocalBusinessSchema,
  getPublicRouteSeo,
  getServicesStructuredData,
  mergeKeywords,
} from '../src/lib/publicSeo.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST_DIR = path.resolve(__dirname, '../dist')
const SSR_DIST_DIR = path.resolve(__dirname, '../dist-ssr')

const STATIC_ROUTES = ['/', '/services', '/work', '/pricing', '/faq', '/contact', '/blogs']

function escapeAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function routeOutputPath(routePath) {
  return routePath === '/'
    ? path.join(DIST_DIR, 'index.html')
    : path.join(DIST_DIR, routePath.slice(1), 'index.html')
}

function injectAppHtml(html, appHtml) {
  return html.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`)
}

function replaceStructuredData(html, structuredData) {
  const script = `<script type="application/ld+json">\n${JSON.stringify(structuredData, null, 2)}\n    </script>`

  if (/<script type="application\/ld\+json">[\s\S]*?<\/script>/.test(html)) {
    return html.replace(
      /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
      script,
    )
  }

  return html.replace('</head>', `    ${script}\n  </head>`)
}

function replaceMeta(html, seo, structuredData) {
  const canonical = seo.path === '/' ? `${SITE_URL}/` : `${SITE_URL}${seo.path}`
  const image = seo.image || DEFAULT_IMAGE
  const type = seo.type || 'website'

  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeAttr(seo.title)}</title>`)
  html = html.replace(
    /<meta name="description" content="[^"]*"/,
    `<meta name="description" content="${escapeAttr(seo.description)}"`,
  )
  html = html.replace(
    /<meta name="keywords" content="[^"]*"/,
    `<meta name="keywords" content="${escapeAttr(mergeKeywords(seo.keywords))}"`,
  )
  html = html.replace(
    /<link rel="canonical" href="[^"]*"/,
    `<link rel="canonical" href="${canonical}"`,
  )
  html = html.replace(
    /<meta property="og:type" content="[^"]*"/,
    `<meta property="og:type" content="${type}"`,
  )
  html = html.replace(
    /<meta property="og:title" content="[^"]*"/,
    `<meta property="og:title" content="${escapeAttr(seo.title)}"`,
  )
  html = html.replace(
    /<meta property="og:description" content="[^"]*"/,
    `<meta property="og:description" content="${escapeAttr(seo.description)}"`,
  )
  html = html.replace(
    /<meta property="og:url" content="[^"]*"/,
    `<meta property="og:url" content="${canonical}"`,
  )
  html = html.replace(
    /<meta property="og:image" content="[^"]*"/,
    `<meta property="og:image" content="${escapeAttr(image)}"`,
  )
  html = html.replace(
    /<meta name="twitter:title" content="[^"]*"/,
    `<meta name="twitter:title" content="${escapeAttr(seo.title)}"`,
  )
  html = html.replace(
    /<meta name="twitter:description" content="[^"]*"/,
    `<meta name="twitter:description" content="${escapeAttr(seo.description)}"`,
  )
  html = html.replace(
    /<meta name="twitter:image" content="[^"]*"/,
    `<meta name="twitter:image" content="${escapeAttr(image)}"`,
  )

  html = html.replace(
    /<meta property="article:published_time" content="[^"]*"\s*\/?>\n?/g,
    '',
  )
  html = html.replace(
    /<meta property="article:modified_time" content="[^"]*"\s*\/?>\n?/g,
    '',
  )

  if (type === 'article' && seo.publishedTime) {
    const articleMeta =
      `    <meta property="article:published_time" content="${escapeAttr(seo.publishedTime)}" />\n` +
      `    <meta property="article:modified_time" content="${escapeAttr(seo.modifiedTime || seo.publishedTime)}" />\n`
    html = html.replace('</head>', `${articleMeta}  </head>`)
  }

  return replaceStructuredData(html, structuredData)
}

function getStructuredDataForRoute(routePath, posts) {
  if (routePath === '/') return getLocalBusinessSchema()
  if (routePath === '/services') return [getLocalBusinessSchema(), getServicesStructuredData()]
  if (routePath === '/faq') return [getLocalBusinessSchema(), getFaqStructuredData()]
  if (routePath === '/blogs') return [getLocalBusinessSchema(), getBlogIndexStructuredData(posts)]
  return getLocalBusinessSchema()
}

async function getSsrEntryPath() {
  const files = await readdir(SSR_DIST_DIR)
  const entryName = files.find(file => file.startsWith('renderPublicApp.') && /\.(m?js)$/.test(file))

  if (!entryName) {
    throw new Error('SSR entry not found in dist-ssr')
  }

  return path.join(SSR_DIST_DIR, entryName)
}

async function main() {
  const template = await readFile(path.join(DIST_DIR, 'index.html'), 'utf8')
  const publishedPosts = await getMergedPublishedPosts({
    supabaseUrl: process.env.VITE_SUPABASE_URL,
    supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY,
  })

  const ssrEntryPath = await getSsrEntryPath()
  const { renderPublicApp } = await import(pathToFileURL(ssrEntryPath).href)

  for (const routePath of STATIC_ROUTES) {
    const seo = getPublicRouteSeo(routePath)
    const appHtml = renderPublicApp({
      url: routePath,
      initialPosts: routePath === '/blogs' ? publishedPosts : undefined,
    })
    const html = replaceMeta(
      injectAppHtml(template, appHtml),
      seo,
      getStructuredDataForRoute(routePath, publishedPosts),
    )

    const outputPath = routeOutputPath(routePath)
    await mkdir(path.dirname(outputPath), { recursive: true })
    await writeFile(outputPath, html, 'utf8')
    console.log(`[prerender] ${routePath}`)
  }

  for (const post of publishedPosts) {
    const seo = getBlogPostSeo(post)
    const appHtml = renderPublicApp({
      url: `/blogs/${post.slug}`,
      initialPost: post,
      initialRelated: getRelatedPublishedPosts(publishedPosts, post.slug),
    })
    const html = replaceMeta(
      injectAppHtml(template, appHtml),
      seo,
      [getLocalBusinessSchema(), seo.structuredData],
    )
    const outputPath = path.join(DIST_DIR, 'blogs', post.slug, 'index.html')
    await mkdir(path.dirname(outputPath), { recursive: true })
    await writeFile(outputPath, html, 'utf8')
    console.log(`[prerender] /blogs/${post.slug}`)
  }

  console.log(`[prerender] Done — ${STATIC_ROUTES.length + publishedPosts.length} pages prerendered`)
}

main().catch((error) => {
  console.error(`[prerender] ${error?.message || String(error)}`)
  process.exit(1)
})
