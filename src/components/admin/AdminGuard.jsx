import { Navigate } from 'react-router-dom'
import { useAuth } from '../../Hooks/useAuth'

export default function AdminGuard({ children }) {
  const { session, loading } = useAuth()
  if (loading) return null
  if (!session) return <Navigate to="/admin/login" replace />
  return children
}
