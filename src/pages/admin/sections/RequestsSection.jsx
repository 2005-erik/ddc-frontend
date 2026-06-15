import { useEffect, useState } from 'react'
import { getRequests, updateRequestStatus } from '../../../api/admin.js'
import { formatDate } from '../format.js'

const STATUSES = [
  { value: 'new', label: 'Новая' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'done', label: 'Готово' },
]

export default function RequestsSection({ onAuthError }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState(null)

  useEffect(() => {
    let active = true
    getRequests()
      .then((data) => active && setRows(data))
      .catch((err) => {
        if (!active) return
        onAuthError(err)
        setError(err.message)
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  async function changeStatus(id, status) {
    setSavingId(id)
    setError('')
    try {
      const updated = await updateRequestStatus(id, status)
      setRows((rs) => rs.map((r) => (r.id === id ? updated : r)))
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
                <tr key={r.id} className="border-t border-white/5 align-top hover:bg-white/5">
                  <td className="whitespace-nowrap px-4 py-3 text-white/60">
                    {formatDate(r.created_at)}
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
