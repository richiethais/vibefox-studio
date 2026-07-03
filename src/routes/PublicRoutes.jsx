import { Navigate, Route } from 'react-router-dom'
import App from '../App.jsx'
import ServicesPage from '../pages/marketing/ServicesPage.jsx'
import CityLandingPage from '../pages/marketing/CityLandingPage.jsx'
import WorkPage from '../pages/marketing/WorkPage.jsx'
import PricingPage from '../pages/marketing/PricingPage.jsx'
import FAQPage from '../pages/marketing/FAQPage.jsx'
import BlogPage from '../pages/marketing/BlogPage.jsx'
import BlogPostPage from '../pages/marketing/BlogPostPage.jsx'
import ContactPage from '../pages/marketing/ContactPage.jsx'
import SupportPage from '../pages/marketing/SupportPage.jsx'
import PrivateCoachingPage from '../pages/marketing/PrivateCoachingPage.jsx'
import PrivateCoachingThanksPage from '../pages/marketing/PrivateCoachingThanksPage.jsx'
import InvoicePage from '../pages/marketing/InvoicePage.jsx'
import LegalPage from '../pages/marketing/LegalPage.jsx'

export function PublicRoutes({ initialPosts, initialPost, initialRelated } = {}) {
  return (
    <>
      <Route path="/" element={<App />} />
      <Route path="/services" element={<ServicesPage />} />
      <Route path="/:citySlug" element={<CityLandingPage />} />
      <Route path="/work" element={<WorkPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/faq" element={<FAQPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/support" element={<SupportPage />} />
      <Route path="/help" element={<Navigate to="/support" replace />} />
      <Route path="/privacy-policy" element={<LegalPage type="privacy-policy" />} />
      <Route path="/privacy" element={<LegalPage type="privacy" />} />
      <Route path="/terms-of-service" element={<LegalPage type="terms-of-service" />} />
      <Route path="/terms" element={<LegalPage type="terms" />} />
      <Route path="/cookie-policy" element={<LegalPage type="cookie-policy" />} />
      <Route path="/cookies" element={<LegalPage type="cookies" />} />
      <Route path="/refund-policy" element={<LegalPage type="refund-policy" />} />
      <Route path="/refunds" element={<LegalPage type="refunds" />} />
      <Route path="/accessibility" element={<LegalPage type="accessibility" />} />
      <Route path="/disclaimer" element={<LegalPage type="disclaimer" />} />
      <Route path="/privatecoaching" element={<PrivateCoachingPage />} />
      <Route path="/privatecoaching/thanks" element={<PrivateCoachingThanksPage />} />
      <Route path="/invoice/:token" element={<InvoicePage />} />
      <Route path="/blogs" element={<BlogPage initialPosts={initialPosts} />} />
      <Route
        path="/blogs/:slug"
        element={<BlogPostPage initialPost={initialPost} initialRelated={initialRelated} />}
      />
      <Route path="/blog" element={<Navigate to="/blogs" replace />} />
      <Route
        path="/blog/:slug"
        element={<BlogPostPage initialPost={initialPost} initialRelated={initialRelated} />}
      />
    </>
  )
}
