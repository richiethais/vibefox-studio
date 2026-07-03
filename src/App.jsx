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
import { getLocalBusinessSchema, getPublicRouteSeo, getWebSiteSchema } from './lib/publicSeo'

export default function App() {
  const seo = getPublicRouteSeo('/')
  const structuredData = [getWebSiteSchema(), getLocalBusinessSchema()]

  return (
    <>
      <SEOHead
        title={seo.title}
        description={seo.description}
        path={seo.path}
        appendBrand={false}
        image={seo.image}
        keywords={seo.keywords}
        structuredData={structuredData}
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
