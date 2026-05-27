import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getMergedPublishedPosts } from '../src/lib/publishedPosts.js'
import { SITE_URL } from '../src/lib/publicSeo.js'
import { cities } from '../src/data/cities.js'

const TODAY = new Date().toISOString().slice(0, 10)

const staticRoutes = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/services', changefreq: 'monthly', priority: '0.85' },
  { path: '/contact', changefreq: 'monthly', priority: '0.8' },
  { path: '/work', changefreq: 'weekly', priority: '0.85' },
  { path: '/pricing', changefreq: 'weekly', priority: '0.8' },
  { path: '/faq', changefreq: 'monthly', priority: '0.75' },
  { path: '/blogs', changefreq: 'weekly', priority: '0.95' },
  { path: '/privacy-policy', changefreq: 'yearly', priority: '0.30' },
  { path: '/terms-of-service', changefreq: 'yearly', priority: '0.30' },
  { path: '/cookie-policy', changefreq: 'yearly', priority: '0.25' },
  { path: '/refund-policy', changefreq: 'yearly', priority: '0.25' },
  { path: '/accessibility', changefreq: 'yearly', priority: '0.25' },
]

const cityRoutes = cities.map(city => ({
  path: `/${city.slug}-digital-marketing-agency`,
  changefreq: 'monthly',
  priority: '0.90',
}))

function escapeXml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function toDateOnly(value) {
  if (!value) return TODAY
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return TODAY
  return date.toISOString().slice(0, 10)
}

function buildXml(staticEntries, blogEntries) {
  const urlEntries = [
    ...staticEntries.map(entry => ({
      loc: `${SITE_URL}${entry.path}`,
      lastmod: TODAY,
      changefreq: entry.changefreq,
      priority: entry.priority,
    })),
    ...blogEntries.map((entry, index) => ({
      loc: `${SITE_URL}/blogs/${entry.slug}`,
      lastmod: toDateOnly(entry.updatedAt || entry.publishedAt),
      changefreq: 'monthly',
      priority: Math.max(0.65, 0.82 - index * 0.01).toFixed(2),
    })),
  ]

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urlEntries.map(entry => [
      '  <url>',
      `    <loc>${escapeXml(entry.loc)}</loc>`,
      `    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`,
      `    <changefreq>${escapeXml(entry.changefreq)}</changefreq>`,
      `    <priority>${escapeXml(entry.priority)}</priority>`,
      '  </url>',
    ].join('\n')),
    '</urlset>',
    '',
  ].join('\n')
}

async function main() {
  const blogEntries = await getMergedPublishedPosts({
    supabaseUrl: process.env.VITE_SUPABASE_URL,
    supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY,
  })

  const allStaticRoutes = [...staticRoutes, ...cityRoutes]
  const xml = buildXml(allStaticRoutes, blogEntries)
  const rootDir = path.dirname(fileURLToPath(import.meta.url))
  const outputPath = path.resolve(rootDir, '../public/sitemap.xml')
  await writeFile(outputPath, xml, 'utf8')

  console.log(`[sitemap] Generated ${allStaticRoutes.length + blogEntries.length} URLs (${cityRoutes.length} city, ${blogEntries.length} blog)`)
}

main().catch(error => {
  console.error(`[sitemap] Failed to generate sitemap: ${error?.message || String(error)}`)
  process.exit(1)
})
