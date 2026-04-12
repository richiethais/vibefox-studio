const BLOG_SLUG_ALIASES = {
  'restaurant-seo-guide-2026-1': 'restaurant-seo-guide-2026',
}

const LEGACY_SLUGS_BY_CANONICAL = Object.entries(BLOG_SLUG_ALIASES).reduce((acc, [legacySlug, canonicalSlug]) => {
  acc[canonicalSlug] = [...(acc[canonicalSlug] || []), legacySlug]
  return acc
}, {})

export function getCanonicalBlogSlug(slug) {
  return BLOG_SLUG_ALIASES[slug] || slug
}

export function getLegacyBlogSlugs(slug) {
  return LEGACY_SLUGS_BY_CANONICAL[getCanonicalBlogSlug(slug)] || []
}

export function getBlogSlugCandidates(slug) {
  const canonicalSlug = getCanonicalBlogSlug(slug)
  return [canonicalSlug, ...getLegacyBlogSlugs(canonicalSlug)]
}
