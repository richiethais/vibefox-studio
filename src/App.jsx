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
import { CTA, Footer } from './components/CTAFooter'
import SEOHead from './components/SEOHead'

export default function App() {
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Vibefox Studio',
    image: 'https://vibefoxstudio.com/image2vector.svg',
    url: 'https://vibefoxstudio.com',
    areaServed: 'Jacksonville, Florida',
    email: 'richie@vibefoxstudio.com',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Jacksonville',
      addressRegion: 'FL',
      addressCountry: 'US',
    },
    description: 'Vibefox Studio is a Jacksonville, Florida digital marketing agency focused on SEO, web development, and lead generation.',
  }

  return (
    <>
      <SEOHead
        title="Best Digital Marketing Agency in Jacksonville, Florida"
        description="Vibefox Studio helps businesses grow with SEO, conversion-focused websites, and weekly content strategy. Serving Jacksonville, Florida."
        path="/"
        keywords="best digital marketing agency in jacksonville florida, jacksonville seo agency, website design jacksonville fl, local seo jacksonville"
        structuredData={localBusinessSchema}
      />
      <Nav />
      <Hero />
      <LogoStrip />
      <Services />
      <HowItWorks />
      <Work />
      <Comparison />
      <Pricing />
      <Testimonial />
      <FAQ />
      <Contact />
      <CTA />
      <Footer />
    </>
  )
}
