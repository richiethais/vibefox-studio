import Nav from '../Nav'
import { CTA, Footer } from '../CTAFooter'

export default function MarketingLayout({ children, showCTA = true, hideCTA }) {
  return (
    <>
      <Nav />
      <main style={{ paddingTop: 110 }}>
        {children}
      </main>
      {!hideCTA && showCTA && <CTA />}
      <Footer />
    </>
  )
}
