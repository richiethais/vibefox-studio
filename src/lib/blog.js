import { supabase } from './supabase'
import { getAllBlogPosts } from '../content/blogPosts'
const LOCAL_POSTS_KEY = 'vibefox.blog_posts'

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

function readLocalPosts() {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LOCAL_POSTS_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function localPublishedPosts() {
  return readLocalPosts()
    .filter(post => post.status === 'published')
    .map(normalizeRow)
    .sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime())
}

export async function fetchPublishedPosts() {
  const local = localPublishedPosts()
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (error || !data || data.length === 0) return local.length > 0 ? local : fallbackPosts()

  const supabasePosts = data.map(normalizeRow)
  if (local.length === 0) return supabasePosts

  const supabaseSlugs = new Set(supabasePosts.map(post => post.slug))
  const merged = [...supabasePosts, ...local.filter(post => !supabaseSlugs.has(post.slug))]
  return merged.sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime())
}

export async function fetchPostBySlug(slug) {
  const local = localPublishedPosts()
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (!error && data) return normalizeRow(data)
  const localPost = local.find(post => post.slug === slug)
  if (localPost) return localPost
  const fallback = fallbackPosts().find(post => post.slug === slug)
  return fallback || null
}
