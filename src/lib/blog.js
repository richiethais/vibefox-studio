import { supabase } from './supabase'
import {
  getFallbackPublishedPosts,
  mergePublishedPosts,
  normalizePublishedPost,
} from './publishedPosts'

export async function publishDueScheduledPosts() {
  try {
    await supabase.rpc('publish_due_blog_posts')
  } catch {
    // Scheduling RPC is optional until the Supabase upgrade SQL has been run.
  }
}

function normalizeRow(row) {
  return normalizePublishedPost(row)
}

function fallbackPosts() {
  return getFallbackPublishedPosts()
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
  return mergePublishedPosts(dbPosts, legacy)
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
