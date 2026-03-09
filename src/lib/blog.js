import { supabase } from './supabase'
import { getAllBlogPosts } from '../content/blogPosts'

export async function publishDueScheduledPosts() {
  try {
    await supabase.rpc('publish_due_blog_posts')
  } catch {
    // Scheduling RPC is optional until the Supabase upgrade SQL has been run.
  }
}

function normalizeRow(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    publishedAt: row.published_at || row.publishedAt || row.created_at,
    readTime: row.read_time || row.readTime || '6 min read',
    category: row.category || 'Digital Marketing',
    keywords: row.keywords || '',
    coverImageUrl: row.cover_image_url || row.coverImageUrl || '',
    body: Array.isArray(row.body)
      ? row.body
      : String(row.content || '').split('\n\n').map(p => p.trim()).filter(Boolean),
    content: row.content || (Array.isArray(row.body) ? row.body.join('\n\n') : ''),
  }
}

function fallbackPosts() {
  return getAllBlogPosts().map(post => normalizeRow({
    ...post,
    content: Array.isArray(post.body) ? post.body.join('\n\n') : '',
    cover_image_url: '',
    status: 'published',
    published_at: post.publishedAt,
    read_time: post.readTime,
  }))
}

export async function fetchPublishedPosts() {
  await publishDueScheduledPosts()

  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  const legacy = fallbackPosts()
  if (error || !data || data.length === 0) return legacy

  const dbPosts = data.map(normalizeRow)
  const dbSlugs = new Set(dbPosts.map(post => post.slug))
  const merged = [...dbPosts, ...legacy.filter(post => !dbSlugs.has(post.slug))]
  return merged.sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime())
}

export async function fetchPostBySlug(slug) {
  await publishDueScheduledPosts()

  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (!error && data) return normalizeRow(data)
  const fallback = fallbackPosts().find(post => post.slug === slug)
  return fallback || null
}
