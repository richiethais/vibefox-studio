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
