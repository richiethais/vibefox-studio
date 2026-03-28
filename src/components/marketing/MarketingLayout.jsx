import Nav from '../Nav'
import { CTA, Footer } from '../CTAFooter'
import useIsMobile from '../useIsMobile'

export default function MarketingLayout({ children, showCTA = true, hideCTA }) {
  const isMobile = useIsMobile()
  return (
    <>
      <Nav />
      <main style={{ paddingTop: isMobile ? 90 : 110 }}>
        {children}
      </main>
      {!hideCTA && showCTA && <CTA />}
      <Footer />
    </>
  )
}
