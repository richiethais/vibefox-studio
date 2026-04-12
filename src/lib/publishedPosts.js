import { getAllBlogPosts } from '../content/blogPosts.js'
import { getBlogSlugCandidates, getCanonicalBlogSlug, getLegacyBlogSlugs } from './blogSlugs.js'

function toBodyList(value) {
  if (Array.isArray(value)) return value.filter(Boolean)
  return String(value || '')
    .split('\n\n')
    .map(item => item.trim())
    .filter(Boolean)
}

export function normalizePublishedPost(row = {}) {
  const body = toBodyList(row.body ?? row.content)
  const canonicalSlug = getCanonicalBlogSlug(row.slug)

  return {
    id: row.id,
    slug: canonicalSlug,
    sourceSlug: row.slug,
    legacySlugs: row.slug && row.slug !== canonicalSlug ? [row.slug, ...getLegacyBlogSlugs(canonicalSlug)] : getLegacyBlogSlugs(canonicalSlug),
    title: row.title,
    excerpt: row.excerpt,
    publishedAt: row.published_at || row.publishedAt || row.created_at,
    updatedAt: row.updated_at || row.updatedAt || row.published_at || row.publishedAt || row.created_at,
    readTime: row.read_time || row.readTime || '6 min read',
    category: row.category || 'Digital Marketing',
    keywords: row.keywords || '',
    coverImageUrl: row.cover_image_url || row.coverImageUrl || '',
    body,
    content: row.content || body.join('\n\n'),
  }
}

export function getFallbackPublishedPosts() {
  return getAllBlogPosts().map(post => normalizePublishedPost({
    ...post,
    content: Array.isArray(post.body) ? post.body.join('\n\n') : '',
    cover_image_url: '',
    status: 'published',
    published_at: post.publishedAt,
    updated_at: post.publishedAt,
    read_time: post.readTime,
  }))
}

export function mergePublishedPosts(primary = [], secondary = []) {
  const seen = new Set()
  const merged = []

  for (const post of [...primary, ...secondary]) {
    if (!post?.slug || seen.has(post.slug)) continue
    seen.add(post.slug)
    merged.push(post)
  }

  return merged.sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime())
}

async function fetchSupabaseRows(url, key, searchParams, fetchImpl = fetch) {
  if (!url || !key) return []

  const requestUrl = new URL(`${url}/rest/v1/blog_posts`)
  Object.entries(searchParams).forEach(([name, value]) => requestUrl.searchParams.set(name, value))

  const response = await fetchImpl(requestUrl, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  })

  if (!response.ok) return []
  const data = await response.json()
  return Array.isArray(data) ? data : []
}

export async function fetchSupabasePublishedPosts({
  supabaseUrl,
  supabaseAnonKey,
  fetchImpl = fetch,
} = {}) {
  try {
    const rows = await fetchSupabaseRows(
      supabaseUrl,
      supabaseAnonKey,
      {
        select: '*',
        status: 'eq.published',
        order: 'published_at.desc',
      },
      fetchImpl,
    )
    return rows.map(normalizePublishedPost).filter(post => post.slug)
  } catch {
    return []
  }
}

export async function fetchSupabasePublishedPostBySlug(
  slug,
  {
    supabaseUrl,
    supabaseAnonKey,
    fetchImpl = fetch,
  } = {},
) {
  if (!slug) return null

  try {
    const candidates = getBlogSlugCandidates(slug).filter(Boolean)
    const rows = await fetchSupabaseRows(
      supabaseUrl,
      supabaseAnonKey,
      {
        select: '*',
        slug: candidates.length === 1 ? `eq.${candidates[0]}` : `in.(${candidates.join(',')})`,
        status: 'eq.published',
        limit: '1',
      },
      fetchImpl,
    )
    return rows[0] ? normalizePublishedPost(rows[0]) : null
  } catch {
    return null
  }
}

export async function getMergedPublishedPosts(options = {}) {
  const supabasePosts = await fetchSupabasePublishedPosts(options)
  return mergePublishedPosts(supabasePosts, getFallbackPublishedPosts())
}

export async function getMergedPublishedPostBySlug(slug, options = {}) {
  const supabasePost = await fetchSupabasePublishedPostBySlug(slug, options)
  if (supabasePost) return supabasePost
  return getFallbackPublishedPosts().find(post => post.slug === slug) || null
}

export function getRelatedPublishedPosts(posts, slug, limit = 3) {
  return (posts || []).filter(post => post.slug !== slug).slice(0, limit)
}
