import { useState } from 'react'
import { useAdminAuth } from './AdminAuthContext.jsx'
import RequestsSection from './sections/RequestsSection.jsx'
import FeedbackSection from './sections/FeedbackSection.jsx'
import NewsSection from './sections/NewsSection.jsx'

const TABS = [
  { id: 'requests', label: 'Заявки' },
  { id: 'feedback', label: 'Обращения' },
  { id: 'news', label: 'Новости' },
]

export default function AdminPanel() {
  const { logout } = useAdminAuth()
  const [tab, setTab] = useState('requests')

  // 401 от любого запроса (токен истёк) → выходим, RequireAuth уведёт на login.
  const onAuthError = (err) => {
    if (err?.status === 401) logout()
  }

  return (
    <div className="flex min-h-screen bg-ink-900 text-white">
      {/* Сайдбар */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-white/10 bg-ink-800">
        <div className="border-b border-white/10 px-5 py-5">
          <div className="font-bold text-nbk-gold">DDC</div>
          <div className="text-xs text-white/40">Админ-панель</div>
        </div>

        <nav className="flex-1 p-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`mb-1 w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                tab === t.id
                  ? 'bg-ddc-blue text-white'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={logout}
            className="w-full rounded-lg border border-white/10 px-3 py-2 text-sm text-white/70 transition hover:border-red-500/40 hover:text-red-300"
          >
            Выйти
          </button>
        </div>
      </aside>

      {/* Контент */}
      <main className="flex-1 overflow-x-auto p-8">
        {tab === 'requests' && <RequestsSection onAuthError={onAuthError} />}
        {tab === 'feedback' && <FeedbackSection onAuthError={onAuthError} />}
        {tab === 'news' && <NewsSection onAuthError={onAuthError} />}
      </main>
    </div>
  )
}
