import SEOHead from '../../components/SEOHead'
import MarketingLayout from '../../components/marketing/MarketingLayout'
import PageHero from '../../components/marketing/PageHero'
import Work from '../../components/Work'
import Testimonial from '../../components/Testimonial'
import Contact from '../../components/Contact'

export default function WorkPage() {
  return (
    <MarketingLayout>
      <SEOHead
        title="Digital Marketing & Web Projects | Jacksonville Case Studies"
        description="Explore website, SEO, and custom app projects delivered for growth-focused brands. See why clients choose Vibefox Studio in Jacksonville, Florida."
        path="/work"
        keywords="digital marketing case studies jacksonville, web design portfolio jacksonville florida, seo project results"
      />

      <PageHero
        eyebrow="Our Work"
        title="Recent website, SEO, and growth projects."
        sub="Real outcomes from businesses that needed better visibility, faster sites, and stronger lead flow in Jacksonville and beyond."
      />

      <Work />
      <Testimonial />
      <Contact />
    </MarketingLayout>
  )
}
