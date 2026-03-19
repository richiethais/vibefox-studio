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
        title="VibefoxStudio Case Studies | Jacksonville Digital Marketing Projects"
        description="Explore website, SEO, and custom app projects delivered for growth-focused brands. See why clients choose VibefoxStudio in Jacksonville, Florida."
        path="/work"
        keywords="digital marketing case studies jacksonville, web design portfolio jacksonville florida, seo project results, jacksonville florida marketing agency portfolio"
      />

      <PageHero
        eyebrow="Demo Projects"
        title="A sample of what we can build."
        sub="From marketing sites to full-stack apps — here's a taste of what's possible when you work with a Jacksonville digital agency that builds everything custom."
      />

      <Work />
      <Testimonial />
      <Contact />
    </MarketingLayout>
  )
}
