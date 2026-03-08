import { Link } from 'react-router-dom'
import SEOHead from '../../components/SEOHead'
import MarketingLayout from '../../components/marketing/MarketingLayout'
import PageHero from '../../components/marketing/PageHero'
import { getAllBlogPosts } from '../../content/blogPosts'

export default function BlogPage() {
  const posts = getAllBlogPosts()
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Vibefox Studio Blog',
    url: 'https://vibefoxstudio.com/blog',
    blogPost: posts.map(post => ({
      '@type': 'BlogPosting',
      headline: post.title,
      datePublished: post.publishedAt,
      url: `https://vibefoxstudio.com/blog/${post.slug}`,
    })),
  }

  return (
    <MarketingLayout>
      <SEOHead
        title="Jacksonville Digital Marketing Blog | SEO Tips & Growth Insights"
        description="Weekly blog posts on SEO, local search, conversion optimization, and digital growth for Jacksonville, Florida businesses."
        path="/blog"
        keywords="jacksonville digital marketing blog, seo tips jacksonville florida, local seo blog"
        structuredData={schema}
      />

      <PageHero
        eyebrow="Blog"
        title="Weekly SEO and digital marketing insights."
        sub="Actionable strategies for businesses trying to rank higher, convert better, and find the best digital marketing agency in Jacksonville, Florida."
      />

      <section style={{ padding: '22px 40px 96px' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {posts.map(post => (
              <article key={post.slug} style={{
                background: '#faf9f7',
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 16,
                padding: 22,
                transition: 'all 0.2s ease',
              }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.7px', textTransform: 'uppercase', color: '#b8906a' }}>{post.category}</span>
                  <span style={{ fontSize: 12, color: '#7a7888' }}>• {new Date(post.publishedAt).toLocaleDateString()}</span>
                  <span style={{ fontSize: 12, color: '#7a7888' }}>• {post.readTime}</span>
                </div>
                <h2 style={{ fontFamily: '"DM Serif Display", serif', fontSize: 32, lineHeight: 1.1, letterSpacing: '-0.8px', color: '#18181a', margin: '0 0 10px' }}>
                  {post.title}
                </h2>
                <p style={{ fontSize: 15, color: '#7a7888', lineHeight: 1.62, margin: '0 0 18px' }}>{post.excerpt}</p>
                <Link to={`/blog/${post.slug}`} style={{ color: '#18181a', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
                  Read article →
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </MarketingLayout>
  )
}
