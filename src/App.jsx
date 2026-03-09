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
    '@id': 'https://vibefoxstudio.com/#localbusiness',
    name: 'VibefoxStudio',
    alternateName: 'Vibefox Studio',
    image: 'https://vibefoxstudio.com/seo-preview.png',
    url: 'https://vibefoxstudio.com',
    areaServed: 'Jacksonville, Florida',
    email: 'richie@vibefoxstudio.com',
    slogan: 'Jacksonville Web Design & SEO Services',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Jacksonville',
      addressRegion: 'FL',
      addressCountry: 'US',
    },
    description: 'Build a website that actually works. Vibefox Studio delivers fast, high-converting websites and SEO systems for Jacksonville businesses ready for measurable growth.',
  }

  return (
    <>
      <SEOHead
        title="Jacksonville Web Design & SEO Services | Vibefox Studio"
        description="Build a website that actually works. Vibefox Studio delivers fast, high-converting websites and SEO systems for Jacksonville businesses ready for measurable growth."
        path="/"
        appendBrand={false}
        image="https://vibefoxstudio.com/seo-preview.png"
        keywords="best digital marketing agency in jacksonville florida, jacksonville seo agency, website design jacksonville fl, local seo jacksonville, digital marketing jacksonville beach, lead generation agency jacksonville"
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
