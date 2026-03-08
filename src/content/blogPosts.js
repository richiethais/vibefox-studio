// Add one new object every week to publish fresh SEO content.
// The blog index and blog post routes auto-render from this file.
export const blogPosts = [
  {
    slug: 'best-digital-marketing-agency-jacksonville-florida-checklist',
    title: 'Best Digital Marketing Agency in Jacksonville, Florida: 12-Point Hiring Checklist',
    excerpt: 'Use this practical checklist to choose the right Jacksonville digital marketing partner for SEO, website growth, and measurable ROI.',
    publishedAt: '2026-03-08',
    readTime: '7 min read',
    category: 'Digital Marketing',
    keywords: 'best digital marketing agency jacksonville florida, jacksonville seo agency, digital strategy jacksonville',
    body: [
      'If you are searching for the best digital marketing agency in Jacksonville, Florida, start by checking process quality before promises. A strong agency should explain how they handle technical SEO, local SEO, content strategy, web performance, and conversion tracking.',
      'Ask for examples in your vertical and request baseline metrics. Good partners can show before-and-after performance for search visibility, qualified leads, and conversion rates. If they only discuss vanity metrics, keep looking.',
      'For Jacksonville businesses, local intent matters. Your agency should optimize Google Business Profile, location pages, internal linking, and service-area content around neighborhoods and nearby cities your customers search from.',
      'Finally, prioritize communication. Weekly updates, clear next steps, and transparent reporting are signs of a healthy long-term growth relationship.'
    ]
  },
  {
    slug: 'jacksonville-local-seo-strategy-small-business',
    title: 'Jacksonville Local SEO Strategy for Small Businesses (2026 Playbook)',
    excerpt: 'A complete local SEO framework for Jacksonville businesses: map rankings, location pages, review velocity, and content clusters.',
    publishedAt: '2026-03-01',
    readTime: '8 min read',
    category: 'Local SEO',
    keywords: 'local seo jacksonville, jacksonville florida seo strategy, google maps seo jacksonville',
    body: [
      'Local SEO in Jacksonville starts with consistent NAP data across your site, Google Business Profile, and citation sources. Keep your business name, address, and phone number identical everywhere.',
      'Build dedicated service pages for each major offering, then reinforce them with location-aware supporting content. This helps search engines connect your services to Jacksonville intent terms.',
      'Reviews are also a ranking lever. Ask happy clients for reviews weekly and respond quickly. Review velocity plus relevance from local keywords can materially improve map visibility.',
      'Track phone calls, forms, and booked appointments from organic traffic. Rankings are useful, but booked revenue is the metric that matters.'
    ]
  },
  {
    slug: 'seo-blogging-calendar-for-lead-generation',
    title: 'How a Weekly SEO Blog Calendar Generates Qualified Leads',
    excerpt: 'A simple weekly publishing framework to grow organic traffic and convert visitors into booked discovery calls.',
    publishedAt: '2026-02-22',
    readTime: '6 min read',
    category: 'Content SEO',
    keywords: 'weekly seo blog strategy, content calendar for seo, lead generation content',
    body: [
      'Publishing weekly is one of the fastest ways to compound SEO. Each post should target one primary query, two supporting entities, and one conversion intent.',
      'Structure each article with clear H2 sections, concise paragraphs, and internal links to your services and case studies. This improves crawl depth and user journey flow.',
      'At the end of every post, include a clear call to action aligned with the stage of awareness. For example: request a site audit, download a checklist, or book a consultation.',
      'Consistency beats volume. Fifty focused posts over a year generally outperform sporadic large batches with no clear topic clustering.'
    ]
  },
  {
    slug: 'website-speed-and-conversion-optimization-jacksonville',
    title: 'Website Speed and Conversion Optimization for Jacksonville Brands',
    excerpt: 'Why page speed, mobile UX, and conversion-first layouts directly impact local search performance and lead quality.',
    publishedAt: '2026-02-15',
    readTime: '5 min read',
    category: 'Web Performance',
    keywords: 'website speed optimization jacksonville, conversion optimization agency florida, mobile ux seo',
    body: [
      'Fast sites do more than improve user satisfaction. They increase crawl efficiency, lower bounce rates, and improve conversion rates across paid and organic channels.',
      'For local service businesses, mobile performance is critical. Most discovery happens on mobile before prospects call or submit forms.',
      'Use compressed assets, efficient fonts, proper caching, and lean JavaScript bundles. Then test above-the-fold clarity: value proposition, trust signals, and single next action.',
      'When speed and conversion strategy are aligned, marketing spend becomes more efficient and organic growth accelerates.'
    ]
  }
]

export function getAllBlogPosts() {
  return [...blogPosts].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
}

export function getBlogPostBySlug(slug) {
  return blogPosts.find(post => post.slug === slug)
}
