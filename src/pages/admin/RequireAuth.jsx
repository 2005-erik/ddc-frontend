import { Navigate } from 'react-router-dom'
import { useAdminAuth } from './AdminAuthContext.jsx'

// Гард маршрута: нет токена — уводим на страницу входа.
export default function RequireAuth({ children }) {
  const { token } = useAdminAuth()
  if (!token) return <Navigate to="/admin/login" replace />
  return children
}
