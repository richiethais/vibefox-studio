import SEOHead from '../../components/SEOHead'
import MarketingLayout from '../../components/marketing/MarketingLayout'
import PageHero from '../../components/marketing/PageHero'
import Work from '../../components/Work'
import Testimonial from '../../components/Testimonial'
import { getPublicRouteSeo } from '../../lib/publicSeo'

export default function WorkPage() {
  const seo = getPublicRouteSeo('/work')

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
        eyebrow="Our Work"
        title="Real sites. Real results."
        sub="Websites we designed, built, and launched for Jacksonville businesses — each one live, fast, and driving real customers."
      />

      <Work hideHeader />
      <Testimonial />
    </MarketingLayout>
  )
}
