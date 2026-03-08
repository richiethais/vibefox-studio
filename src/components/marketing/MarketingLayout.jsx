import Nav from '../Nav'
import { CTA, Footer } from '../CTAFooter'

export default function MarketingLayout({ children, showCTA = true }) {
  return (
    <>
      <Nav />
      <main style={{ paddingTop: 110 }}>
        {children}
      </main>
      {showCTA && <CTA />}
      <Footer />
    </>
  )
}
