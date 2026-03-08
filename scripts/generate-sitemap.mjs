import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SITE_URL = 'https://vibefoxstudio.com'
const TODAY = new Date().toISOString().slice(0, 10)

const staticRoutes = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/services', changefreq: 'weekly', priority: '0.9' },
  { path: '/work', changefreq: 'weekly', priority: '0.85' },
  { path: '/pricing', changefreq: 'weekly', priority: '0.8' },
  { path: '/faq', changefreq: 'monthly', priority: '0.75' },
  { path: '/blogs', changefreq: 'weekly', priority: '0.95' },
]

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

async function getFallbackPosts() {
  const blogContent = await import('../src/content/blogPosts.js')
  const posts = typeof blogContent.getAllBlogPosts === 'function' ? blogContent.getAllBlogPosts() : []

  return posts
    .filter(post => post?.slug)
    .map(post => ({
      slug: post.slug,
      lastmod: toDateOnly(post.publishedAt),
    }))
}

async function getSupabasePosts() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) return []

  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data, error } = await supabase
      .from('blog_posts')
      .select('slug,published_at,updated_at,created_at,status')
      .eq('status', 'published')
      .order('published_at', { ascending: false })

    if (error || !data) {
      console.warn(`[sitemap] Supabase fetch skipped: ${error?.message || 'no data'}`)
      return []
    }

    return data
      .filter(post => post?.slug)
      .map(post => ({
        slug: post.slug,
        lastmod: toDateOnly(post.updated_at || post.published_at || post.created_at),
      }))
  } catch (error) {
    console.warn(`[sitemap] Supabase fetch failed: ${error?.message || String(error)}`)
    return []
  }
}

function mergePosts(primary, secondary) {
  const seen = new Set()
  const merged = []

  for (const post of [...primary, ...secondary]) {
    if (!post?.slug || seen.has(post.slug)) continue
    seen.add(post.slug)
    merged.push(post)
  }

  return merged.sort((a, b) => new Date(b.lastmod).getTime() - new Date(a.lastmod).getTime())
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
      lastmod: entry.lastmod,
      changefreq: 'monthly',
      priority: Math.max(0.65, 0.82 - index * 0.01).toFixed(2),
    })),
  ]

  const xml = [
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

  return { xml, count: urlEntries.length }
}

async function main() {
  const [supabasePosts, fallbackPosts] = await Promise.all([
    getSupabasePosts(),
    getFallbackPosts(),
  ])

  const blogEntries = mergePosts(supabasePosts, fallbackPosts)
  const { xml, count } = buildXml(staticRoutes, blogEntries)

  const rootDir = path.dirname(fileURLToPath(import.meta.url))
  const outputPath = path.resolve(rootDir, '../public/sitemap.xml')
  await writeFile(outputPath, xml, 'utf8')

  console.log(`[sitemap] Generated ${count} URLs (${blogEntries.length} blog URLs)`)
}

main().catch(error => {
  console.error(`[sitemap] Failed to generate sitemap: ${error?.message || String(error)}`)
  process.exit(1)
})
