import { Routes, Route, Navigate } from 'react-router-dom'
import { AdminAuthProvider } from './AdminAuthContext.jsx'
import RequireAuth from './RequireAuth.jsx'
import AdminLogin from './AdminLogin.jsx'
import AdminPanel from './AdminPanel.jsx'

// Самодостаточное приложение админки. Монтируется в App.jsx на /admin/*.
// Свои вложенные маршруты (относительные): login и сама панель.
export default function AdminApp() {
  return (
    <AdminAuthProvider>
      <Routes>
        <Route path="login" element={<AdminLogin />} />
        <Route
          index
          element={
            <RequireAuth>
              <AdminPanel />
            </RequireAuth>
          }
        />
        {/* всё прочее под /admin — на панель */}
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminAuthProvider>
  )
}
