import { createContext, useContext, useState, useCallback } from 'react'
import { getToken, setToken, clearToken } from '../../api/adminAuth.js'

// Контекст авторизации админки. Держит текущий токен в React-состоянии
// (чтобы маршруты реагировали на вход/выход) и синхронизирует его с хранилищем.
const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
  const [token, setTokenState] = useState(() => getToken())

  const login = useCallback((newToken) => {
    setToken(newToken)
    setTokenState(newToken)
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setTokenState(null)
  }, [])

  return (
    <AdminAuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth должен вызываться внутри AdminAuthProvider')
  return ctx
}
