import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import { AuthProvider } from './lib/auth'
import AdminDashboard from './pages/admin/Dashboard.jsx'
import AdminInquiries from './pages/admin/Inquiries.jsx'
import AdminCoaching from './pages/admin/Coaching.jsx'
import AdminClients from './pages/admin/Clients.jsx'
import AdminProjects from './pages/admin/Projects.jsx'
import AdminInvoices from './pages/admin/Invoices.jsx'
import AdminMessages from './pages/admin/Messages.jsx'
import AdminNotes from './pages/admin/Notes.jsx'
import AdminSeoNotes from './pages/admin/SeoNotes.jsx'
import AdminCalendar from './pages/admin/Calendar.jsx'
import AdminBlogs from './pages/admin/Blogs.jsx'
import AdminSupport from './pages/admin/Support.jsx'
import AdminAccessLinks from './pages/admin/AccessLinks.jsx'
import AdminAccessLinkRedeem from './pages/admin/AccessLinkRedeem.jsx'
import ClientDashboard from './pages/client/Dashboard.jsx'
import ClientProjects from './pages/client/Projects.jsx'
import ClientInvoices from './pages/client/Invoices.jsx'
import ClientMessages from './pages/client/Messages.jsx'
import ClientSupport from './pages/client/Support.jsx'
import Login from './pages/Login.jsx'
import Join from './pages/Join.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import AdminLayout from './components/admin/AdminLayout.jsx'
import ClientLayout from './components/client/ClientLayout.jsx'
import { AdminRoute, ClientRoute } from './components/ProtectedRoute.jsx'
import { PublicRoutes } from './routes/PublicRoutes.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {PublicRoutes()}
          <Route path="/login" element={<Login />} />
          <Route path="/join" element={<Join />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="/admin/login" element={<Navigate to="/login" replace />} />
          <Route path="/admin/access" element={<AdminAccessLinkRedeem />} />
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="inquiries" element={<AdminInquiries />} />
            <Route path="coaching" element={<AdminCoaching />} />
            <Route path="support" element={<AdminSupport />} />
            <Route path="clients" element={<AdminClients />} />
            <Route path="projects" element={<AdminProjects />} />
            <Route path="invoices" element={<AdminInvoices />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="notes" element={<AdminNotes />} />
            <Route path="seo-notes" element={<AdminSeoNotes />} />
            <Route path="calendar" element={<AdminCalendar />} />
            <Route path="blogs" element={<AdminBlogs />} />
            <Route path="access-links" element={<AdminAccessLinks />} />
          </Route>

          <Route path="/client/login" element={<Navigate to="/login" replace />} />
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
