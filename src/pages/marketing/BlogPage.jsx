import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import SEOHead from '../../components/SEOHead'
import MarketingLayout from '../../components/marketing/MarketingLayout'
import PageHero from '../../components/marketing/PageHero'
import { fetchPublishedPosts } from '../../lib/blog'
import useIsMobile from '../../components/useIsMobile'
import { getBlogIndexStructuredData, getPublicRouteSeo } from '../../lib/publicSeo'

export default function BlogPage({ initialPosts }) {
  const isMobile = useIsMobile()
  const [posts, setPosts] = useState(initialPosts || [])
  const [loading, setLoading] = useState(!initialPosts?.length)

  useEffect(() => {
    fetchPublishedPosts().then(data => {
      setPosts(data)
      setLoading(false)
    })
  }, [])

  const seo = getPublicRouteSeo('/blogs')
  const schema = getBlogIndexStructuredData(posts)

  return (
    <MarketingLayout>
      <SEOHead
        title={seo.title}
        description={seo.description}
        path={seo.path}
        appendBrand={false}
        keywords={seo.keywords}
        structuredData={schema}
      />

      <PageHero
        eyebrow="Blogs"
        title="Weekly SEO and digital marketing insights."
        sub="Actionable strategies from VibefoxStudio for businesses trying to rank higher, convert better, and grow consistently."
      />

      <section style={{ padding: isMobile ? '16px 18px 80px' : '22px 40px 96px' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          {loading ? (
            <div style={{ padding: '18px 0', color: '#7a7888', fontSize: 14 }}>Loading blogs…</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {posts.map(post => (
                <article key={post.slug} style={{
                  background: '#faf9f7',
                  border: '1px solid rgba(0,0,0,0.08)',
                  borderRadius: 16,
                  padding: isMobile ? 16 : 18,
                  transition: 'all 0.2s ease',
                }}>
                  {post.coverImageUrl && (
                    <div style={{
                      width: '100%',
                      aspectRatio: '16 / 10',
                      borderRadius: isMobile ? 14 : 18,
                      background: 'linear-gradient(135deg, #f6f1ea 0%, #eee6db 100%)',
                      border: '1px solid rgba(0,0,0,0.06)',
                      overflow: 'hidden',
                      marginBottom: 14,
                      boxShadow: '0 10px 24px rgba(0,0,0,0.09)',
                    }}>
                      <img
                        src={post.coverImageUrl}
                        alt={post.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.7px', textTransform: 'uppercase', color: '#b8906a' }}>{post.category}</span>
                    <span style={{ fontSize: 12, color: '#7a7888' }}>• {new Date(post.publishedAt).toLocaleDateString()}</span>
                    <span style={{ fontSize: 12, color: '#7a7888' }}>• {post.readTime}</span>
                  </div>
                  <h2 style={{ fontFamily: '"DM Serif Display", serif', fontSize: isMobile ? 28 : 32, lineHeight: 1.1, letterSpacing: '-0.8px', color: '#18181a', margin: '0 0 10px' }}>
                    {post.title}
                  </h2>
                  <p style={{ fontSize: isMobile ? 14 : 15, color: '#7a7888', lineHeight: 1.62, margin: '0 0 18px' }}>{post.excerpt}</p>
                  <Link
                    to={`/blogs/${post.slug}`}
                    state={{ preloadedPost: post }}
                    style={{ color: '#18181a', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}
                  >
                    Read article →
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </MarketingLayout>
  )
}
