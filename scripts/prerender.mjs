import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.resolve(__dirname, '../dist')
const SITE_URL = 'https://www.vibefoxstudio.com'

// Route metadata — mirrors SEOHead props from each page component
const routes = [
  {
    path: '/',
    title: 'Jacksonville Web Design & SEO Services | Vibefox Studio',
    description: 'Build a website that actually works. Vibefox Studio delivers fast, high-converting websites and SEO systems for Jacksonville businesses ready for measurable growth.',
    keywords: 'best digital marketing agency in jacksonville florida, jacksonville seo agency, website design jacksonville fl, local seo jacksonville, digital marketing jacksonville beach, lead generation agency jacksonville',
  },
  {
    path: '/services',
    title: 'VibefoxStudio Services | Jacksonville SEO, Web Design & Growth',
    description: 'Jacksonville-focused SEO, websites, content strategy, and conversion-focused digital marketing services from VibefoxStudio.',
    keywords: 'digital marketing services jacksonville florida, seo services jacksonville, web design and seo agency jacksonville, best digital marketing agency in jacksonville florida, local marketing company jacksonville',
  },
  {
    path: '/work',
    title: 'Our Work | Jacksonville Web Design & SEO Projects | VibefoxStudio',
    description: "See real websites and SEO projects we've built for Jacksonville businesses. From restaurants to food trucks — explore our portfolio of live client work.",
    keywords: 'web design portfolio jacksonville, jacksonville website examples, restaurant website design jacksonville florida, seo project results jacksonville, vibefox studio portfolio',
  },
  {
    path: '/pricing',
    title: 'VibefoxStudio Pricing | Jacksonville SEO & Digital Marketing Plans',
    description: 'Transparent monthly digital marketing and SEO pricing for Jacksonville businesses. Flexible plans for websites, content, and ongoing growth from VibefoxStudio.',
    keywords: 'digital marketing pricing jacksonville florida, seo packages jacksonville, website maintenance plans, jacksonville digital marketing growth plan',
  },
  {
    path: '/faq',
    title: 'VibefoxStudio FAQ | Jacksonville Digital Marketing Questions',
    description: 'Answers to common SEO, website, and digital marketing questions for Jacksonville businesses evaluating agency partners.',
    keywords: 'digital marketing faq jacksonville florida, seo agency questions, jacksonville marketing support, best digital marketing agency in jacksonville florida',
  },
  {
    path: '/contact',
    title: 'Contact VibefoxStudio | Jacksonville Digital Marketing Agency',
    description: 'Get in touch with Vibefox Studio. We typically respond within 24 hours.',
    keywords: '',
  },
  {
    path: '/blogs',
    title: 'VibefoxStudio Blogs | Jacksonville SEO Tips & Digital Marketing Insights',
    description: 'Weekly blog posts on SEO, local search, conversion optimization, and digital growth for Jacksonville, Florida businesses.',
    keywords: 'jacksonville digital marketing blog, seo tips jacksonville florida, local seo blog, best digital marketing agency in jacksonville florida',
  },
]

const GLOBAL_KEYWORDS = [
  'vibefoxstudio',
  'vibefox studio',
  'best digital marketing agency in jacksonville florida',
  'jacksonville digital marketing agency',
  'seo agency jacksonville fl',
  'website design jacksonville florida',
  'local seo jacksonville',
]

function mergeKeywords(custom) {
  const all = [...GLOBAL_KEYWORDS, ...(custom ? custom.split(',') : [])]
  return [...new Set(all.map(k => k.trim().toLowerCase()).filter(Boolean))].join(', ')
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function injectMeta(html, route) {
  const title = escapeHtml(route.title)
  const desc = escapeHtml(route.description)
  const keywords = escapeHtml(mergeKeywords(route.keywords))
  const canonical = `${SITE_URL}${route.path === '/' ? '/' : route.path}`
  const ogUrl = canonical

  // Replace title
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)

  // Replace meta description
  html = html.replace(
    /<meta name="description" content="[^"]*"/,
    `<meta name="description" content="${desc}"`
  )

  // Replace meta keywords
  html = html.replace(
    /<meta name="keywords" content="[^"]*"/,
    `<meta name="keywords" content="${keywords}"`
  )

  // Replace canonical
  html = html.replace(
    /<link rel="canonical" href="[^"]*"/,
    `<link rel="canonical" href="${canonical}"`
  )

  // Replace OG tags
  html = html.replace(
    /<meta property="og:title" content="[^"]*"/,
    `<meta property="og:title" content="${title}"`
  )
  html = html.replace(
    /<meta property="og:description" content="[^"]*"/,
    `<meta property="og:description" content="${desc}"`
  )
  html = html.replace(
    /<meta property="og:url" content="[^"]*"/,
    `<meta property="og:url" content="${ogUrl}"`
  )

  // Replace Twitter tags
  html = html.replace(
    /<meta name="twitter:title" content="[^"]*"/,
    `<meta name="twitter:title" content="${title}"`
  )
  html = html.replace(
    /<meta name="twitter:description" content="[^"]*"/,
    `<meta name="twitter:description" content="${desc}"`
  )

  return html
}

async function getBlogPosts() {
  try {
    const blogContent = await import('../src/content/blogPosts.js')
    return typeof blogContent.getAllBlogPosts === 'function' ? blogContent.getAllBlogPosts() : []
  } catch {
    return []
  }
}

async function main() {
  // Import the SSR render function from the built server bundle
  const { render } = await import(path.join(DIST, 'server', 'entry-server.js'))

  // Read the client-built HTML template
  const template = await readFile(path.join(DIST, 'index.html'), 'utf-8')

  // Save original as SPA fallback for non-prerendered routes (admin, client, auth)
  await copyFile(path.join(DIST, 'index.html'), path.join(DIST, 'spa.html'))

  let count = 0

  // Prerender static marketing routes
  for (const route of routes) {
    try {
      const { html: appHtml } = render(route.path)
      let page = template.replace(
        '<div id="root"></div>',
        `<div id="root">${appHtml}</div>`
      )
      page = injectMeta(page, route)

      const outPath = route.path === '/'
        ? path.join(DIST, 'index.html')
        : path.join(DIST, route.path.slice(1), 'index.html')

      await mkdir(path.dirname(outPath), { recursive: true })
      await writeFile(outPath, page, 'utf-8')
      count++
      console.log(`[prerender] ✓ ${route.path}`)
    } catch (err) {
      console.warn(`[prerender] ✗ ${route.path}: ${err.message}`)
    }
  }

  // Prerender blog posts from local fallback content
  const blogPosts = await getBlogPosts()
  for (const post of blogPosts) {
    const blogPath = `/blogs/${post.slug}`
    try {
      const { html: appHtml } = render(blogPath)
      let page = template.replace(
        '<div id="root"></div>',
        `<div id="root">${appHtml}</div>`
      )
      // Blog posts use article-specific meta
      page = injectMeta(page, {
        path: blogPath,
        title: post.title.includes('VibefoxStudio') ? post.title : `${post.title} | VibefoxStudio`,
        description: post.excerpt,
        keywords: post.keywords || '',
      })
      // Add article meta tags
      if (post.publishedAt) {
        page = page.replace(
          '</head>',
          `    <meta property="article:published_time" content="${post.publishedAt}" />\n    <meta property="article:modified_time" content="${post.publishedAt}" />\n  </head>`
        )
        // Change og:type to article
        page = page.replace(
          '<meta property="og:type" content="website"',
          '<meta property="og:type" content="article"'
        )
      }

      const outDir = path.join(DIST, 'blogs', post.slug)
      await mkdir(outDir, { recursive: true })
      await writeFile(path.join(outDir, 'index.html'), page, 'utf-8')
      count++
      console.log(`[prerender] ✓ ${blogPath}`)
    } catch (err) {
      console.warn(`[prerender] ✗ ${blogPath}: ${err.message}`)
    }
  }

  console.log(`[prerender] Done — ${count} pages prerendered`)
}

main().catch(err => {
  console.error(`[prerender] Fatal: ${err.message}`)
  // Non-fatal — site still works as SPA if prerendering fails
  process.exit(0)
})
