import { useState, useEffect, useCallback } from 'react'
import { useAdminAuth } from './AdminAuthContext.jsx'
import { getNewRequestsCount } from '../../api/admin.js'
import RequestsSection from './sections/RequestsSection.jsx'
import FeedbackSection from './sections/FeedbackSection.jsx'
import NewsSection from './sections/NewsSection.jsx'

const TABS = [
  { id: 'requests', label: 'Заявки' },
  { id: 'feedback', label: 'Обращения' },
  { id: 'news', label: 'Новости' },
]

// период автообновления счётчика новых заявок
const NEW_COUNT_POLL_MS = 25000

export default function AdminPanel() {
  const { logout } = useAdminAuth()
  const [tab, setTab] = useState('requests')
  const [newCount, setNewCount] = useState(0)

  // 401 от любого запроса (токен истёк) → выходим, RequireAuth уведёт на login.
  const onAuthError = useCallback(
    (err) => {
      if (err?.status === 401) logout()
    },
    [logout],
  )

  // Подтянуть актуальное число новых заявок с бэкенда.
  const refreshNewCount = useCallback(() => {
    return getNewRequestsCount()
      .then(({ count }) => setNewCount(count))
      .catch(onAuthError)
  }, [onAuthError])

  // Автообновление бейджа: сразу при входе + каждые 25 секунд.
  // Счётчик живёт здесь (в сайдбаре), поэтому бейдж виден на любой вкладке.
  useEffect(() => {
    refreshNewCount()
    const id = setInterval(refreshNewCount, NEW_COUNT_POLL_MS)
    return () => clearInterval(id)
  }, [refreshNewCount])

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
              className={`mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                tab === t.id
                  ? 'bg-ddc-blue text-white'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span>{t.label}</span>
              {/* золотой бейдж с числом новых заявок; нет новых — не показываем */}
              {t.id === 'requests' && newCount > 0 && (
                <span className="ml-2 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-nbk-gold px-1.5 text-xs font-bold text-ink-900">
                  {newCount}
                </span>
              )}
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
        {tab === 'requests' && (
          <RequestsSection onAuthError={onAuthError} onRequestsChanged={refreshNewCount} />
        )}
        {tab === 'feedback' && <FeedbackSection onAuthError={onAuthError} />}
        {tab === 'news' && <NewsSection onAuthError={onAuthError} />}
      </main>
    </div>
  )
}
