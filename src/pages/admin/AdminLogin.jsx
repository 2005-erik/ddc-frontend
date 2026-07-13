import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { login as apiLogin } from '../../api/admin.js'
import { useAdminAuth } from './AdminAuthContext.jsx'

// Страница входа в админку: username + password → POST /api/admin/login.
export default function AdminLogin() {
  const { token, login } = useAdminAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Уже вошли — нечего показывать форму.
  if (token) return <Navigate to="/admin" replace />

  async function onSubmit(e) {
    e.preventDefault()
    if (busy) return
    setError('')
    setBusy(true)
    try {
      const { token: newToken } = await apiLogin(username.trim(), password)
      login(newToken)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err.message || 'Не удалось войти')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4 text-white">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-xl border border-white/10 bg-ink-900 p-8 shadow-xl"
      >
        <h1 className="text-xl font-bold text-nbk-gold">Админ-панель DDC</h1>
        <p className="mt-1 text-sm text-white/50">Вход для администраторов</p>

        <label className="mt-6 block text-sm text-white/70">
          Логин
          <input
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-white outline-none focus:border-ddc-blue-light"
            required
          />
        </label>

        <label className="mt-4 block text-sm text-white/70">
          Пароль
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-white outline-none focus:border-ddc-blue-light"
            required
          />
        </label>

        {error && (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-lg bg-nbk-gold px-4 py-2 font-semibold text-ink-900 transition hover:bg-nbk-gold-soft disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? 'Вход…' : 'Войти'}
        </button>
      </form>
    </div>
  )
}
