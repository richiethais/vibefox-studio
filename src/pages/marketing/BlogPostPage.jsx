import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import SEOHead from '../../components/SEOHead'
import MarketingLayout from '../../components/marketing/MarketingLayout'
import { fetchPostBySlug, fetchPublishedPosts } from '../../lib/blog'
import useIsMobile from '../../components/useIsMobile'

export default function BlogPostPage() {
  const isMobile = useIsMobile()
  const { slug } = useParams()
  const location = useLocation()
  const [post, setPost] = useState(undefined)
  const [related, setRelated] = useState([])
  const preloadedPost = location.state?.preloadedPost
  const matchingPreloadedPost = preloadedPost?.slug === slug ? preloadedPost : null
  const matchingFetchedPost = post?.slug === slug ? post : null
  const activePost = matchingFetchedPost || matchingPreloadedPost

  useEffect(() => {
    let active = true

    Promise.all([fetchPostBySlug(slug), fetchPublishedPosts()]).then(([entry, allPosts]) => {
      if (!active) return
      setPost(entry)
      setRelated((allPosts || []).filter(p => p.slug !== slug).slice(0, 3))
    })

    return () => { active = false }
  }, [slug])

  if (!activePost && post === undefined) {
    return (
      <MarketingLayout>
        <div style={{ padding: isMobile ? '110px 18px 64px' : '130px 40px 80px' }}>
          <div style={{ maxWidth: 840, margin: '0 auto', background: '#faf9f7', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 22, padding: 22 }}>
            <div style={{ width: 140, height: 14, borderRadius: 100, background: '#ece9e4', marginBottom: 18 }} />
            <div style={{ width: '86%', height: 52, borderRadius: 14, background: '#ece9e4', marginBottom: 10 }} />
            <div style={{ width: '68%', height: 22, borderRadius: 12, background: '#ece9e4', marginBottom: 18 }} />
            <div style={{ width: '100%', aspectRatio: '16 / 10', borderRadius: 18, background: '#eee8de', marginBottom: 18 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ width: '100%', height: 14, borderRadius: 9, background: '#ece9e4' }} />
              <div style={{ width: '100%', height: 14, borderRadius: 9, background: '#ece9e4' }} />
              <div style={{ width: '90%', height: 14, borderRadius: 9, background: '#ece9e4' }} />
            </div>
          </div>
        </div>
      </MarketingLayout>
    )
  }

  if (!activePost && post === null) {
    return <Navigate to="/blogs" replace />
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: activePost.title,
    datePublished: activePost.publishedAt,
    dateModified: activePost.publishedAt,
    description: activePost.excerpt,
    author: {
      '@type': 'Organization',
      name: 'VibefoxStudio',
    },
    publisher: {
      '@type': 'Organization',
      name: 'VibefoxStudio',
      logo: {
        '@type': 'ImageObject',
        url: 'https://vibefoxstudio.com/favicon-512x512.png',
      },
    },
    mainEntityOfPage: `https://vibefoxstudio.com/blogs/${activePost.slug}`,
  }

  return (
    <MarketingLayout>
      <SEOHead
        title={activePost.title}
        description={activePost.excerpt}
        path={`/blogs/${activePost.slug}`}
        keywords={activePost.keywords}
        type="article"
        publishedTime={activePost.publishedAt}
        modifiedTime={activePost.publishedAt}
        structuredData={schema}
      />

      <article style={{ padding: isMobile ? '34px 18px 72px' : '44px 40px 86px' }}>
        <div style={{ maxWidth: 840, margin: '0 auto' }}>
          <Link to="/blogs" style={{ fontSize: 13, color: '#7a7888', textDecoration: 'none' }}>← Back to blogs</Link>
          <div style={{ marginTop: 18, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.7px', textTransform: 'uppercase', color: '#b8906a' }}>{activePost.category}</span>
            <span style={{ fontSize: 12, color: '#7a7888' }}>• {new Date(activePost.publishedAt).toLocaleDateString()}</span>
            <span style={{ fontSize: 12, color: '#7a7888' }}>• {activePost.readTime}</span>
          </div>

          <h1 style={{ fontFamily: '"DM Serif Display", serif', fontSize: isMobile ? 'clamp(31px, 11vw, 44px)' : 'clamp(36px, 6vw, 66px)', lineHeight: 1.03, color: '#18181a', letterSpacing: isMobile ? '-1px' : '-1.5px', margin: '12px 0 16px' }}>
            {activePost.title}
          </h1>

          <p style={{ fontSize: isMobile ? 16 : 18, color: '#7a7888', lineHeight: 1.66, margin: '0 0 26px' }}>
            {activePost.excerpt}
          </p>

          {activePost.coverImageUrl && (
            <div
              style={{
                width: '100%',
                aspectRatio: '16 / 10',
                borderRadius: isMobile ? 16 : 20,
                marginBottom: 26,
                border: '1px solid rgba(0,0,0,0.07)',
                background: 'linear-gradient(135deg, #f6f1ea 0%, #eee6db 100%)',
                overflow: 'hidden',
                boxShadow: '0 14px 30px rgba(0,0,0,0.1)',
              }}
            >
              <img
                src={activePost.coverImageUrl}
                alt={activePost.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          )}

          <div style={{ height: 1, background: 'rgba(0,0,0,0.08)', marginBottom: 24 }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {activePost.body.map(paragraph => (
              <p key={paragraph.slice(0, 24)} style={{ fontSize: isMobile ? 16 : 17, lineHeight: 1.78, color: '#3a3840', margin: 0 }}>
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </article>

      <section style={{ padding: isMobile ? '0 18px 68px' : '0 40px 80px' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <h2 style={{ fontFamily: '"DM Serif Display", serif', fontSize: isMobile ? 28 : 34, color: '#18181a', margin: '0 0 14px' }}>More from the blog</h2>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
            {related.map(item => (
              <article key={item.slug} style={{ background: '#faf9f7', borderRadius: 14, border: '1px solid rgba(0,0,0,0.08)', padding: isMobile ? 15 : 18 }}>
                {item.coverImageUrl && (
                  <div style={{ width: '100%', aspectRatio: '16 / 10', borderRadius: 14, overflow: 'hidden', background: 'linear-gradient(135deg, #f6f1ea 0%, #eee6db 100%)', border: '1px solid rgba(0,0,0,0.06)', marginBottom: 10, boxShadow: '0 8px 20px rgba(0,0,0,0.08)' }}>
                    <img src={item.coverImageUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div style={{ fontSize: 12, color: '#7a7888', marginBottom: 8 }}>{new Date(item.publishedAt).toLocaleDateString()} · {item.readTime}</div>
                <h3 style={{ fontSize: isMobile ? 17 : 18, lineHeight: 1.25, color: '#18181a', margin: '0 0 8px' }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: '#7a7888', lineHeight: 1.6, margin: '0 0 10px' }}>{item.excerpt}</p>
                <Link to={`/blogs/${item.slug}`} state={{ preloadedPost: item }} style={{ color: '#18181a', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>Read →</Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </MarketingLayout>
  )
}
