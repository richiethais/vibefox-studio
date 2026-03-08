import SEOHead from '../../components/SEOHead'
import MarketingLayout from '../../components/marketing/MarketingLayout'
import PageHero from '../../components/marketing/PageHero'
import Pricing from '../../components/Pricing'
import FAQ from '../../components/FAQ'
import Contact from '../../components/Contact'

export default function PricingPage() {
  return (
    <MarketingLayout>
      <SEOHead
        title="VibefoxStudio Pricing | Jacksonville SEO & Digital Marketing Plans"
        description="Transparent monthly digital marketing and SEO pricing for Jacksonville businesses. Flexible plans for websites, content, and ongoing growth from VibefoxStudio."
        path="/pricing"
        keywords="digital marketing pricing jacksonville florida, seo packages jacksonville, website maintenance plans, jacksonville digital marketing retainer"
      />

      <PageHero
        eyebrow="Pricing"
        title="Simple pricing for serious business growth."
        sub="Choose a monthly plan for ongoing SEO, website support, and lead generation. Built for businesses comparing the best digital marketing agencies in Jacksonville, Florida."
      />

      <Pricing />
      <FAQ />
      <Contact />
    </MarketingLayout>
  )
}
