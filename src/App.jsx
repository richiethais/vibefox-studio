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
import { CTA, Footer } from './components/CTAFooter'

export default function App() {
  return (
    <>
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
      <CTA />
      <Footer />
    </>
  )
}
