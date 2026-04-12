import SEOHead from '../../components/SEOHead'
import MarketingLayout from '../../components/marketing/MarketingLayout'
import PageHero from '../../components/marketing/PageHero'
import FAQ from '../../components/FAQ'
import { getFaqStructuredData, getPublicRouteSeo } from '../../lib/publicSeo'

export default function FAQPage() {
  const seo = getPublicRouteSeo('/faq')
  const faqSchema = getFaqStructuredData()

  return (
    <MarketingLayout>
      <SEOHead
        title={seo.title}
        description={seo.description}
        path={seo.path}
        appendBrand={false}
        keywords={seo.keywords}
        structuredData={faqSchema}
      />

      <PageHero
        eyebrow="FAQ"
        title="Questions business owners ask before they invest in growth."
        sub="Clear answers about SEO, web strategy, timelines, and support from a Jacksonville-focused VibefoxStudio digital marketing team."
      />

      <FAQ hideHeader />
    </MarketingLayout>
  )
}
