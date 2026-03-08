import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import SEOHead from '../../components/SEOHead'
import MarketingLayout from '../../components/marketing/MarketingLayout'
import { fetchPostBySlug, fetchPublishedPosts } from '../../lib/blog'

export default function BlogPostPage() {
  const { slug } = useParams()
  const [post, setPost] = useState(undefined)
  const [related, setRelated] = useState([])

  useEffect(() => {
    let active = true

    Promise.all([fetchPostBySlug(slug), fetchPublishedPosts()]).then(([entry, allPosts]) => {
      if (!active) return
      setPost(entry)
      setRelated((allPosts || []).filter(p => p.slug !== slug).slice(0, 3))
    })

    return () => { active = false }
  }, [slug])

  if (post === undefined) {
    return (
      <MarketingLayout>
        <div style={{ padding: '140px 40px 100px', maxWidth: 840, margin: '0 auto', color: '#7a7888' }}>
          Loading post…
        </div>
      </MarketingLayout>
    )
  }

  if (!post) {
    return <Navigate to="/blog" replace />
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    description: post.excerpt,
    author: {
      '@type': 'Organization',
      name: 'Vibefox Studio',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Vibefox Studio',
      logo: {
        '@type': 'ImageObject',
        url: 'https://vibefoxstudio.com/image2vector.svg',
      },
    },
    mainEntityOfPage: `https://vibefoxstudio.com/blog/${post.slug}`,
  }

  return (
    <MarketingLayout>
      <SEOHead
        title={post.title}
        description={post.excerpt}
        path={`/blog/${post.slug}`}
        keywords={post.keywords}
        type="article"
        structuredData={schema}
      />

      <article style={{ padding: '44px 40px 86px' }}>
        <div style={{ maxWidth: 840, margin: '0 auto' }}>
          <Link to="/blog" style={{ fontSize: 13, color: '#7a7888', textDecoration: 'none' }}>← Back to blog</Link>
          <div style={{ marginTop: 18, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.7px', textTransform: 'uppercase', color: '#b8906a' }}>{post.category}</span>
            <span style={{ fontSize: 12, color: '#7a7888' }}>• {new Date(post.publishedAt).toLocaleDateString()}</span>
            <span style={{ fontSize: 12, color: '#7a7888' }}>• {post.readTime}</span>
          </div>

          <h1 style={{ fontFamily: '"DM Serif Display", serif', fontSize: 'clamp(36px, 6vw, 66px)', lineHeight: 1.03, color: '#18181a', letterSpacing: '-1.5px', margin: '12px 0 16px' }}>
            {post.title}
          </h1>

          <p style={{ fontSize: 18, color: '#7a7888', lineHeight: 1.66, margin: '0 0 26px' }}>
            {post.excerpt}
          </p>

          {post.coverImageUrl && (
            <img
              src={post.coverImageUrl}
              alt={post.title}
              style={{ width: '100%', borderRadius: 16, marginBottom: 26, border: '1px solid rgba(0,0,0,0.07)' }}
            />
          )}

          <div style={{ height: 1, background: 'rgba(0,0,0,0.08)', marginBottom: 24 }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {post.body.map(paragraph => (
              <p key={paragraph.slice(0, 24)} style={{ fontSize: 17, lineHeight: 1.78, color: '#3a3840', margin: 0 }}>
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </article>

      <section style={{ padding: '0 40px 80px' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <h2 style={{ fontFamily: '"DM Serif Display", serif', fontSize: 34, color: '#18181a', margin: '0 0 14px' }}>More from the blog</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
            {related.map(item => (
              <article key={item.slug} style={{ background: '#faf9f7', borderRadius: 14, border: '1px solid rgba(0,0,0,0.08)', padding: 18 }}>
                <div style={{ fontSize: 12, color: '#7a7888', marginBottom: 8 }}>{new Date(item.publishedAt).toLocaleDateString()} · {item.readTime}</div>
                <h3 style={{ fontSize: 18, lineHeight: 1.25, color: '#18181a', margin: '0 0 8px' }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: '#7a7888', lineHeight: 1.6, margin: '0 0 10px' }}>{item.excerpt}</p>
                <Link to={`/blog/${item.slug}`} style={{ color: '#18181a', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>Read →</Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </MarketingLayout>
  )
}
