import SEOHead from '../../components/SEOHead'
import MarketingLayout from '../../components/marketing/MarketingLayout'
import PageHero from '../../components/marketing/PageHero'
import Work from '../../components/Work'
import Testimonial from '../../components/Testimonial'

export default function WorkPage() {
  return (
    <MarketingLayout>
      <SEOHead
        title="Our Work | Jacksonville Web Design & SEO Projects | VibefoxStudio"
        description="See real websites and SEO projects we've built for Jacksonville businesses. From restaurants to food trucks — explore our portfolio of live client work."
        path="/work"
        keywords="web design portfolio jacksonville, jacksonville website examples, restaurant website design jacksonville florida, seo project results jacksonville, vibefox studio portfolio"
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
