import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST_DIR = path.resolve(__dirname, '../dist')
const API_DIR = path.resolve(__dirname, '../api')
const SITE_URL = 'https://www.vibefoxstudio.com'
const DEFAULT_IMAGE = `${SITE_URL}/seo-preview.png`

const GLOBAL_KEYWORDS =
  'vibefoxstudio, vibefox studio, best digital marketing agency in jacksonville florida, jacksonville digital marketing agency, seo agency jacksonville fl, website design jacksonville florida, local seo jacksonville'

const routes = [
  {
    path: '/',
    title: 'Jacksonville Web Design & SEO Services | Vibefox Studio',
    description:
      'Build a website that actually works. Vibefox Studio delivers fast, high-converting websites and SEO systems for Jacksonville businesses ready for measurable growth.',
    keywords:
      'best digital marketing agency in jacksonville florida, jacksonville seo agency, website design jacksonville fl, local seo jacksonville, digital marketing jacksonville beach, lead generation agency jacksonville',
    image: DEFAULT_IMAGE,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      '@id': `${SITE_URL}/#localbusiness`,
      name: 'VibefoxStudio',
      alternateName: 'Vibefox Studio',
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
      description:
        'Build a website that actually works. Vibefox Studio delivers fast, high-converting websites and SEO systems for Jacksonville businesses ready for measurable growth.',
    },
  },
  {
    path: '/services',
    title: 'VibefoxStudio Services | Jacksonville SEO, Web Design & Growth',
    description:
      'Jacksonville-focused SEO, websites, content strategy, and conversion-focused digital marketing services from VibefoxStudio.',
    keywords:
      'digital marketing services jacksonville florida, seo services jacksonville, web design and seo agency jacksonville, best digital marketing agency in jacksonville florida, local marketing company jacksonville',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Service',
      serviceType: 'Digital Marketing and Web Development',
      provider: {
        '@type': 'LocalBusiness',
        name: 'VibefoxStudio',
        alternateName: 'Vibefox Studio',
        areaServed: 'Jacksonville, Florida',
        url: `${SITE_URL}/services`,
      },
      areaServed: { '@type': 'City', name: 'Jacksonville' },
    },
  },
  {
    path: '/work',
    title: 'Our Work | Jacksonville Web Design & SEO Projects | VibefoxStudio',
    description:
      "See real websites and SEO projects we've built for Jacksonville businesses. From restaurants to food trucks — explore our portfolio of live client work.",
    keywords:
      'web design portfolio jacksonville, jacksonville website examples, restaurant website design jacksonville florida, seo project results jacksonville, vibefox studio portfolio',
  },
  {
    path: '/pricing',
    title: 'VibefoxStudio Pricing | Jacksonville SEO & Digital Marketing Plans',
    description:
      'Transparent monthly digital marketing and SEO pricing for Jacksonville businesses. Flexible plans for websites, content, and ongoing growth from VibefoxStudio.',
    keywords:
      'digital marketing pricing jacksonville florida, seo packages jacksonville, website maintenance plans, jacksonville digital marketing growth plan',
  },
  {
    path: '/faq',
    title: 'VibefoxStudio FAQ | Jacksonville Digital Marketing Questions',
    description:
      'Answers to common SEO, website, and digital marketing questions for Jacksonville businesses evaluating agency partners.',
    keywords:
      'digital marketing faq jacksonville florida, seo agency questions, jacksonville marketing support, best digital marketing agency in jacksonville florida',
    structuredData: {
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
    },
  },
  {
    path: '/contact',
    title: 'Contact VibefoxStudio | Jacksonville Digital Marketing Agency',
    description:
      'Get in touch with Vibefox Studio. We typically respond within 24 hours.',
  },
  {
    path: '/blogs',
    title:
      'VibefoxStudio Blogs | Jacksonville SEO Tips & Digital Marketing Insights',
    description:
      'Weekly blog posts on SEO, local search, conversion optimization, and digital growth for Jacksonville, Florida businesses.',
    keywords:
      'jacksonville digital marketing blog, seo tips jacksonville florida, local seo blog, best digital marketing agency in jacksonville florida',
  },
]

function escapeAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function replaceMeta(html, route) {
  const title = route.title
  const canonical =
    route.path === '/' ? `${SITE_URL}/` : `${SITE_URL}${route.path}`
  const image = route.image || DEFAULT_IMAGE
  const allKeywords = route.keywords
    ? `${route.keywords}, ${GLOBAL_KEYWORDS}`
    : GLOBAL_KEYWORDS

  html = html.replace(
    /<title>[^<]*<\/title>/,
    `<title>${escapeAttr(title)}</title>`,
  )
  html = html.replace(
    /<meta name="description" content="[^"]*"/,
    `<meta name="description" content="${escapeAttr(route.description)}"`,
  )
  html = html.replace(
    /<meta name="keywords" content="[^"]*"/,
    `<meta name="keywords" content="${escapeAttr(allKeywords)}"`,
  )
  html = html.replace(
    /<link rel="canonical" href="[^"]*"/,
    `<link rel="canonical" href="${canonical}"`,
  )
  html = html.replace(
    /<meta property="og:title" content="[^"]*"/,
    `<meta property="og:title" content="${escapeAttr(title)}"`,
  )
  html = html.replace(
    /<meta property="og:description" content="[^"]*"/,
    `<meta property="og:description" content="${escapeAttr(route.description)}"`,
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
    `<meta name="twitter:title" content="${escapeAttr(title)}"`,
  )
  html = html.replace(
    /<meta name="twitter:description" content="[^"]*"/,
    `<meta name="twitter:description" content="${escapeAttr(route.description)}"`,
  )
  html = html.replace(
    /<meta name="twitter:image" content="[^"]*"/,
    `<meta name="twitter:image" content="${escapeAttr(image)}"`,
  )

  if (route.structuredData) {
    html = html.replace(
      /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
      `<script type="application/ld+json">\n${JSON.stringify(route.structuredData, null, 2)}\n    </script>`,
    )
  }

  return html
}

async function generateBlogTemplate(template) {
  await mkdir(API_DIR, { recursive: true })

  const code = `// Auto-generated by scripts/prerender-meta.mjs — do not edit manually
const HTML_TEMPLATE = ${JSON.stringify(template)}

const SITE_URL = 'https://www.vibefoxstudio.com'
const DEFAULT_IMAGE = SITE_URL + '/seo-preview.png'
const GLOBAL_KEYWORDS = ${JSON.stringify(GLOBAL_KEYWORDS)}

function escapeAttr(str) {
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function renderBlogPage({ title, description, image, slug, keywords, publishedAt, updatedAt } = {}) {
  let html = HTML_TEMPLATE

  const fullTitle = title
    ? escapeAttr(title + ' | VibefoxStudio')
    : 'VibefoxStudio Blogs | Jacksonville SEO Tips & Digital Marketing Insights'
  const desc = escapeAttr(
    description ||
      'Weekly blog posts on SEO, local search, conversion optimization, and digital growth for Jacksonville, Florida businesses.',
  )
  const img = escapeAttr(image || DEFAULT_IMAGE)
  const canonical = slug ? SITE_URL + '/blogs/' + slug : SITE_URL + '/blogs'
  const kw = escapeAttr(keywords ? keywords + ', ' + GLOBAL_KEYWORDS : GLOBAL_KEYWORDS)

  html = html.replace(/<title>[^<]*<\\/title>/, '<title>' + fullTitle + '</title>')
  html = html.replace(/<meta name="description" content="[^"]*"/, '<meta name="description" content="' + desc + '"')
  html = html.replace(/<meta name="keywords" content="[^"]*"/, '<meta name="keywords" content="' + kw + '"')
  html = html.replace(/<link rel="canonical" href="[^"]*"/, '<link rel="canonical" href="' + canonical + '"')
  html = html.replace(/<meta property="og:title" content="[^"]*"/, '<meta property="og:title" content="' + fullTitle + '"')
  html = html.replace(/<meta property="og:description" content="[^"]*"/, '<meta property="og:description" content="' + desc + '"')
  html = html.replace(/<meta property="og:url" content="[^"]*"/, '<meta property="og:url" content="' + canonical + '"')
  html = html.replace(/<meta property="og:image" content="[^"]*"/, '<meta property="og:image" content="' + img + '"')
  html = html.replace(/<meta name="twitter:title" content="[^"]*"/, '<meta name="twitter:title" content="' + fullTitle + '"')
  html = html.replace(/<meta name="twitter:description" content="[^"]*"/, '<meta name="twitter:description" content="' + desc + '"')
  html = html.replace(/<meta name="twitter:image" content="[^"]*"/, '<meta name="twitter:image" content="' + img + '"')

  if (slug) {
    html = html.replace(/<meta property="og:type" content="[^"]*"/, '<meta property="og:type" content="article"')
  }

  if (publishedAt) {
    html = html.replace(
      '</head>',
      '    <meta property="article:published_time" content="' + publishedAt + '" />\\n' +
      '    <meta property="article:modified_time" content="' + (updatedAt || publishedAt) + '" />\\n' +
      '  </head>',
    )
  }

  if (slug && title) {
    const schema = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: title,
      description: description || '',
      image: image || DEFAULT_IMAGE,
      datePublished: publishedAt,
      dateModified: updatedAt || publishedAt,
      url: canonical,
      publisher: {
        '@type': 'Organization',
        name: 'Vibefox Studio',
        url: SITE_URL,
        logo: SITE_URL + '/logo-mark.png',
      },
    })
    html = html.replace(
      /<script type="application\\/ld\\+json">[\\s\\S]*?<\\/script>/,
      '<script type="application/ld+json">' + schema + '</script>',
    )
  }

  return html
}
`

  await writeFile(path.join(API_DIR, '_blog-template.js'), code, 'utf8')
  console.log('[prerender] Generated api/_blog-template.js')
}

async function main() {
  const template = await readFile(path.join(DIST_DIR, 'index.html'), 'utf8')

  for (const route of routes) {
    const html = replaceMeta(template, route)

    if (route.path === '/') {
      await writeFile(path.join(DIST_DIR, 'index.html'), html, 'utf8')
    } else {
      const dir = path.join(DIST_DIR, route.path.slice(1))
      await mkdir(dir, { recursive: true })
      await writeFile(path.join(dir, 'index.html'), html, 'utf8')
    }

    console.log(`[prerender] ${route.path}`)
  }

  await generateBlogTemplate(template)
  console.log(`[prerender] Done — ${routes.length} pages prerendered`)
}

main().catch((error) => {
  console.error(`[prerender] ${error.message}`)
  process.exit(1)
})
