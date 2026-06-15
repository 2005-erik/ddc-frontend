import { useEffect, useState } from 'react'
import { getFeedback } from '../../../api/admin.js'
import { formatDate } from '../format.js'

export default function FeedbackSection({ onAuthError }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getFeedback()
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

  return (
    <section>
      <h1 className="mb-1 text-2xl font-bold">Обращения</h1>
      <p className="mb-6 text-sm text-white/50">Отзывы о сайте и обращения в поддержку</p>

      {error && <p className="mb-4 text-sm text-red-300">{error}</p>}
      {loading ? (
        <p className="text-white/50">Загрузка…</p>
      ) : rows.length === 0 ? (
        <p className="text-white/50">Обращений пока нет.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-ink-800 text-white/60">
              <tr>
                <th className="px-4 py-3 font-medium">Дата</th>
                <th className="px-4 py-3 font-medium">Тип</th>
                <th className="px-4 py-3 font-medium">Имя</th>
                <th className="px-4 py-3 font-medium">Сообщение</th>
                <th className="px-4 py-3 font-medium">Оценка</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-white/5 align-top hover:bg-white/5">
                  <td className="whitespace-nowrap px-4 py-3 text-white/60">
                    {formatDate(r.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        r.kind === 'отзыв'
                          ? 'bg-nbk-gold/15 text-nbk-gold'
                          : 'bg-ddc-blue/20 text-ddc-blue-light'
                      }`}
                    >
                      {r.kind}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/90">{r.name || '—'}</td>
                  <td className="max-w-md px-4 py-3 text-white/70">{r.message}</td>
                  <td className="px-4 py-3 text-white/90">
                    {r.rating ? `${r.rating} / 5` : '—'}
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
