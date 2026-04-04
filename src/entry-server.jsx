import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { Routes, Route } from 'react-router-dom'
import { AuthContext } from './lib/authContext'
import App from './App'
import ServicesPage from './pages/marketing/ServicesPage'
import WorkPage from './pages/marketing/WorkPage'
import PricingPage from './pages/marketing/PricingPage'
import FAQPage from './pages/marketing/FAQPage'
import BlogPage from './pages/marketing/BlogPage'
import BlogPostPage from './pages/marketing/BlogPostPage'
import ContactPage from './pages/marketing/ContactPage'

export function render(url) {
  const html = renderToString(
    <AuthContext.Provider value={null}>
      <StaticRouter location={url}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/work" element={<WorkPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/blogs" element={<BlogPage />} />
          <Route path="/blogs/:slug" element={<BlogPostPage />} />
        </Routes>
      </StaticRouter>
    </AuthContext.Provider>
  )
  return { html }
}
