import { renderBlogPage } from './_blog-template.js'

export const config = { runtime: 'edge' }

const htmlResponse = (html) =>
  new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })

export default async function handler(request) {
  const url = new URL(request.url)
  const slug = url.searchParams.get('slug')

  if (!slug) {
    return htmlResponse(renderBlogPage())
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return htmlResponse(renderBlogPage({ slug }))
  }

  try {
    const apiUrl = `${supabaseUrl}/rest/v1/blog_posts?slug=eq.${encodeURIComponent(slug)}&status=eq.published&select=title,slug,excerpt,cover_image_url,keywords,published_at,updated_at,category`

    const response = await fetch(apiUrl, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    })

    if (!response.ok) {
      return htmlResponse(renderBlogPage({ slug }))
    }

    const posts = await response.json()
    const post = posts?.[0]

    if (!post) {
      return htmlResponse(renderBlogPage({ slug }))
    }

    return htmlResponse(
      renderBlogPage({
        title: post.title,
        description: post.excerpt,
        image: post.cover_image_url,
        slug: post.slug,
        keywords: post.keywords,
        publishedAt: post.published_at,
        updatedAt: post.updated_at,
      }),
    )
  } catch {
    return htmlResponse(renderBlogPage({ slug }))
  }
}
