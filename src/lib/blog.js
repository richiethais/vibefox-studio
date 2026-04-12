import { supabase } from './supabase'
import {
  getFallbackPublishedPosts,
  mergePublishedPosts,
  normalizePublishedPost,
} from './publishedPosts'
import { getBlogSlugCandidates } from './blogSlugs.js'

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
  const slugCandidates = getBlogSlugCandidates(slug).filter(Boolean)

  let query = supabase
    .from('blog_posts')
    .select('*')
    .eq('status', 'published')

  query = slugCandidates.length === 1
    ? query.eq('slug', slugCandidates[0])
    : query.in('slug', slugCandidates)

  const { data, error } = await query
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!error && data) return normalizeRow(data)
  const fallback = fallbackPosts().find(post => slugCandidates.includes(post.slug))
  return fallback || null
}
