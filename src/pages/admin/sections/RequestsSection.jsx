import { useEffect, useState } from 'react'
import { getRequests, updateRequestStatus } from '../../../api/admin.js'
import { formatDate } from '../format.js'

const STATUSES = [
  { value: 'new', label: 'Новая' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'done', label: 'Готово' },
]

// период автообновления списка заявок
const POLL_MS = 25000

export default function RequestsSection({ onAuthError, onRequestsChanged }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState(null)

  // Автообновление: загрузка сразу + опрос каждые 25 секунд, чтобы новые
  // заявки появлялись без перезагрузки. Опрос «тихий» — без спиннера.
  useEffect(() => {
    let active = true
    const load = () =>
      getRequests()
        .then((data) => {
          if (!active) return
          setRows(data)
          setError('')
        })
        .catch((err) => {
          if (!active) return
          onAuthError(err)
          setError(err.message)
        })
        .finally(() => active && setLoading(false))

    load()
    const id = setInterval(load, POLL_MS)
    return () => {
      active = false
      clearInterval(id)
    }
  }, [onAuthError])

  async function changeStatus(id, status) {
    setSavingId(id)
    setError('')
    try {
      const updated = await updateRequestStatus(id, status)
      setRows((rs) => rs.map((r) => (r.id === id ? updated : r)))
      // статус мог измениться с «новая» → обновляем бейдж в сайдбаре
      onRequestsChanged?.()
    } catch (err) {
      onAuthError(err)
      setError(err.message)
    } finally {
      setSavingId(null)
    }
  }

  return (
    <section>
      <h1 className="mb-1 text-2xl font-bold">Заявки</h1>
      <p className="mb-6 text-sm text-white/50">Заявки на услуги и консультации</p>

      {error && <p className="mb-4 text-sm text-red-300">{error}</p>}
      {loading ? (
        <p className="text-white/50">Загрузка…</p>
      ) : rows.length === 0 ? (
        <p className="text-white/50">Заявок пока нет.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-ink-800 text-white/60">
              <tr>
                <th className="px-4 py-3 font-medium">Дата</th>
                <th className="px-4 py-3 font-medium">Тип / услуга</th>
                <th className="px-4 py-3 font-medium">Имя</th>
                <th className="px-4 py-3 font-medium">Контакт</th>
                <th className="px-4 py-3 font-medium">Сообщение</th>
                <th className="px-4 py-3 font-medium">Статус</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className={`border-t border-white/5 align-top transition-colors ${
                    r.status === 'new'
                      ? 'bg-nbk-gold/[0.06] hover:bg-nbk-gold/10'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <td className="whitespace-nowrap px-4 py-3 text-white/60">
                    <span className="inline-flex items-center gap-2">
                      {/* золотая метка слева у новых заявок */}
                      {r.status === 'new' && (
                        <span
                          className="h-2 w-2 shrink-0 rounded-full bg-nbk-gold"
                          aria-label="новая"
                        />
                      )}
                      <span className={r.status === 'new' ? 'text-white/90' : undefined}>
                        {formatDate(r.created_at)}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-white/90">{r.type}</div>
                    {r.service && <div className="text-xs text-white/50">{r.service}</div>}
                  </td>
                  <td className="px-4 py-3 text-white/90">{r.name}</td>
                  <td className="px-4 py-3 text-white/70">{r.contact}</td>
                  <td className="max-w-xs px-4 py-3 text-white/70">{r.message}</td>
                  <td className="px-4 py-3">
                    <select
                      value={r.status}
                      disabled={savingId === r.id}
                      onChange={(e) => changeStatus(r.id, e.target.value)}
                      className="rounded-md border border-white/10 bg-ink-900 px-2 py-1 text-white outline-none focus:border-ddc-blue-light disabled:opacity-60"
                    >
                      {STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
