import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL

export function AdminRoute({ children }) {
  const session = useAuth()
  if (session === undefined) return null
  if (!session || session.user?.email !== ADMIN_EMAIL) return <Navigate to="/admin/login" replace />
  return children
}

export function ClientRoute({ children }) {
  const session = useAuth()
  if (session === undefined) return null
  if (!session) return <Navigate to="/client/login" replace />
  return children
}
