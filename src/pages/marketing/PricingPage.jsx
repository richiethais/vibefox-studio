import SEOHead from '../../components/SEOHead'
import MarketingLayout from '../../components/marketing/MarketingLayout'
import PageHero from '../../components/marketing/PageHero'
import Pricing from '../../components/Pricing'
import FAQ from '../../components/FAQ'
import { getPublicRouteSeo } from '../../lib/publicSeo'

export default function PricingPage() {
  const seo = getPublicRouteSeo('/pricing')

  return (
    <MarketingLayout>
      <SEOHead
        title={seo.title}
        description={seo.description}
        path={seo.path}
        appendBrand={false}
        keywords={seo.keywords}
      />

      <PageHero
        eyebrow="Pricing"
        title="Simple pricing for serious business growth."
        sub="One-time projects or ongoing monthly plans — no contracts, cancel anytime. Built for businesses comparing the best digital marketing agencies in Jacksonville, Florida."
      />

      <Pricing hideHeader />
      <FAQ hideHeader />
    </MarketingLayout>
  )
}
