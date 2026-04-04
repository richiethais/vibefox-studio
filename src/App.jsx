import Nav from './components/Nav'
import Hero from './components/Hero'
import LogoStrip from './components/LogoStrip'
import Services from './components/Services'
import HowItWorks from './components/HowItWorks'
import Work from './components/Work'
import Comparison from './components/Comparison'
import Pricing from './components/Pricing'
import Testimonial from './components/Testimonial'
import FAQ from './components/FAQ'
import Contact from './components/Contact'
import { Footer } from './components/CTAFooter'
import SEOHead from './components/SEOHead'

export default function App() {
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': 'https://www.vibefoxstudio.com/#localbusiness',
    name: 'VibefoxStudio',
    alternateName: 'Vibefox Studio',
    image: 'https://www.vibefoxstudio.com/seo-preview.png',
    logo: 'https://www.vibefoxstudio.com/logo-mark.png',
    url: 'https://www.vibefoxstudio.com',
    telephone: '+1-904-000-0000',
    email: 'inquiries@vibefoxstudio.com',
    slogan: 'Jacksonville Web Design & SEO Services',
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '1301 Riverplace Blvd',
      addressLocality: 'Jacksonville',
      addressRegion: 'FL',
      postalCode: '32207',
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 30.3166,
      longitude: -81.6558,
    },
    areaServed: [
      { '@type': 'City', name: 'Jacksonville', sameAs: 'https://en.wikipedia.org/wiki/Jacksonville,_Florida' },
      { '@type': 'State', name: 'Florida' },
    ],
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '17:00',
      },
    ],
    sameAs: [],
    description: 'Build a website that actually works. Vibefox Studio delivers fast, high-converting websites and SEO systems for Jacksonville businesses ready for measurable growth.',
  }

  return (
    <>
      <SEOHead
        title="Jacksonville Web Design & SEO Services | Vibefox Studio"
        description="Build a website that actually works. Vibefox Studio delivers fast, high-converting websites and SEO systems for Jacksonville businesses ready for measurable growth."
        path="/"
        appendBrand={false}
        image="https://www.vibefoxstudio.com/seo-preview.png"
        keywords="best digital marketing agency in jacksonville florida, jacksonville seo agency, website design jacksonville fl, local seo jacksonville, digital marketing jacksonville beach, lead generation agency jacksonville"
        structuredData={localBusinessSchema}
      />
      <Nav />
      <Hero />
      <LogoStrip />
      <Services />
      <Work />
      <Testimonial />
      <HowItWorks />
      <Comparison />
      <Pricing />
      <FAQ />
      <Contact />
      <Footer />
    </>
  )
}
