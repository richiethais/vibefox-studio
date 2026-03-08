import SEOHead from '../../components/SEOHead'
import MarketingLayout from '../../components/marketing/MarketingLayout'
import PageHero from '../../components/marketing/PageHero'
import LogoStrip from '../../components/LogoStrip'
import Services from '../../components/Services'
import HowItWorks from '../../components/HowItWorks'
import Comparison from '../../components/Comparison'
import Contact from '../../components/Contact'

export default function ServicesPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Digital Marketing and Web Development',
    provider: {
      '@type': 'LocalBusiness',
      name: 'VibefoxStudio',
      alternateName: 'Vibefox Studio',
      areaServed: 'Jacksonville, Florida',
      url: 'https://vibefoxstudio.com/services',
    },
    areaServed: {
      '@type': 'City',
      name: 'Jacksonville',
    },
  }

  return (
    <MarketingLayout>
      <SEOHead
        title="VibefoxStudio Services | Jacksonville SEO, Web Design & Growth"
        description="Jacksonville-focused SEO, websites, content strategy, and conversion-focused digital marketing services from VibefoxStudio."
        path="/services"
        keywords="digital marketing services jacksonville florida, seo services jacksonville, web design and seo agency jacksonville, best digital marketing agency in jacksonville florida, local marketing company jacksonville"
        structuredData={schema}
      />

      <PageHero
        eyebrow="Services"
        title="Digital marketing services built for Jacksonville growth."
        sub="From local SEO to high-converting websites, VibefoxStudio (Vibefox Studio) helps businesses searching for the best digital marketing agency in Jacksonville, Florida turn traffic into revenue."
      />

      <LogoStrip />
      <Services />
      <HowItWorks />
      <Comparison />
      <Contact />
    </MarketingLayout>
  )
}
