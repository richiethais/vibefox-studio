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
    image: 'https://vibefoxstudio.com/favicon-512x512.png',
    url: 'https://vibefoxstudio.com',
    areaServed: 'Jacksonville, Florida',
    email: 'richie@vibefoxstudio.com',
    slogan: 'Best Digital Marketing Agency in Jacksonville',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Jacksonville',
      addressRegion: 'FL',
      addressCountry: 'US',
    },
    description: 'VibefoxStudio is a Jacksonville, Florida digital marketing agency focused on SEO, website design, and lead generation for small businesses.',
  }

  return (
    <>
      <SEOHead
        title="Best Digital Marketing Agency Jacksonville FL | VibefoxStudio"
        description="VibefoxStudio is Jacksonville's top-rated digital marketing agency. SEO, website design, and lead generation that drives real business growth."
        path="/"
        appendBrand={false}
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
