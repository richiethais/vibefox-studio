import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import { AuthProvider } from './lib/auth'
import App from './App.jsx'
import AdminLogin from './pages/admin/Login.jsx'
import AdminDashboard from './pages/admin/Dashboard.jsx'
import AdminInquiries from './pages/admin/Inquiries.jsx'
import AdminClients from './pages/admin/Clients.jsx'
import AdminProjects from './pages/admin/Projects.jsx'
import AdminInvoices from './pages/admin/Invoices.jsx'
import AdminMessages from './pages/admin/Messages.jsx'
import AdminNotes from './pages/admin/Notes.jsx'
import AdminSeoNotes from './pages/admin/SeoNotes.jsx'
import AdminCalendar from './pages/admin/Calendar.jsx'
import AdminBlogs from './pages/admin/Blogs.jsx'
import AdminSupport from './pages/admin/Support.jsx'
import ClientLogin from './pages/client/Login.jsx'
import ClientDashboard from './pages/client/Dashboard.jsx'
import ClientProjects from './pages/client/Projects.jsx'
import ClientInvoices from './pages/client/Invoices.jsx'
import ClientMessages from './pages/client/Messages.jsx'
import ClientSupport from './pages/client/Support.jsx'
import Join from './pages/Join.jsx'
import AdminLayout from './components/admin/AdminLayout.jsx'
import ClientLayout from './components/client/ClientLayout.jsx'
import { AdminRoute, ClientRoute } from './components/ProtectedRoute.jsx'
import ServicesPage from './pages/marketing/ServicesPage.jsx'
import WorkPage from './pages/marketing/WorkPage.jsx'
import PricingPage from './pages/marketing/PricingPage.jsx'
import FAQPage from './pages/marketing/FAQPage.jsx'
import BlogPage from './pages/marketing/BlogPage.jsx'
import BlogPostPage from './pages/marketing/BlogPostPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/work" element={<WorkPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/blogs" element={<BlogPage />} />
          <Route path="/blogs/:slug" element={<BlogPostPage />} />
          <Route path="/blog" element={<Navigate to="/blogs" replace />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/join" element={<Join />} />

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="inquiries" element={<AdminInquiries />} />
            <Route path="support" element={<AdminSupport />} />
            <Route path="clients" element={<AdminClients />} />
            <Route path="projects" element={<AdminProjects />} />
            <Route path="invoices" element={<AdminInvoices />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="notes" element={<AdminNotes />} />
            <Route path="seo-notes" element={<AdminSeoNotes />} />
            <Route path="calendar" element={<AdminCalendar />} />
            <Route path="blogs" element={<AdminBlogs />} />
          </Route>

          <Route path="/client/login" element={<ClientLogin />} />
          <Route path="/client" element={<ClientRoute><ClientLayout /></ClientRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<ClientDashboard />} />
            <Route path="projects" element={<ClientProjects />} />
            <Route path="invoices" element={<ClientInvoices />} />
            <Route path="messages" element={<ClientMessages />} />
            <Route path="support" element={<ClientSupport />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
)
