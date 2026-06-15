import { useEffect, useState } from 'react'
import { getNews, createNews, updateNews, deleteNews } from '../../../api/admin.js'
import { formatDate } from '../format.js'

const EMPTY = { title: '', excerpt: '', body: '', category: '', image_url: '' }

export default function NewsSection({ onAuthError }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // editingId === null → режим «добавить»; иначе редактируем эту новость.
  const [editingId, setEditingId] = useState(null)
  // published_at редактируемой новости сохраняем, чтобы не сбросить дату при PUT.
  const [editingPublishedAt, setEditingPublishedAt] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    getNews()
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

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  function resetForm() {
    setEditingId(null)
    setEditingPublishedAt(null)
    setForm(EMPTY)
  }

  function startEdit(n) {
    setEditingId(n.id)
    setEditingPublishedAt(n.published_at)
    setForm({
      title: n.title || '',
      excerpt: n.excerpt || '',
      body: n.body || '',
      category: n.category || '',
      image_url: n.image_url || '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (saving || !form.title.trim()) return
    setSaving(true)
    setError('')
    try {
      if (editingId === null) {
        // Новая новость: проставляем дату публикации, чтобы она сразу
        // встала в ленту главной страницы с корректной сортировкой.
        const created = await createNews({ ...form, published_at: new Date().toISOString() })
        setRows((rs) => [created, ...rs])
      } else {
        const updated = await updateNews(editingId, {
          ...form,
          published_at: editingPublishedAt,
        })
        setRows((rs) => rs.map((r) => (r.id === editingId ? updated : r)))
      }
      resetForm()
    } catch (err) {
      onAuthError(err)
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(id) {
    if (!window.confirm('Удалить новость? Действие необратимо.')) return
    setError('')
    try {
      await deleteNews(id)
      setRows((rs) => rs.filter((r) => r.id !== id))
      if (editingId === id) resetForm()
    } catch (err) {
      onAuthError(err)
      setError(err.message)
    }
  }

  const inputCls =
    'mt-1 w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-white outline-none focus:border-ddc-blue-light'

  return (
    <section>
      <h1 className="mb-1 text-2xl font-bold">Новости</h1>
      <p className="mb-6 text-sm text-white/50">
        Изменения сразу отражаются на главной странице сайта
      </p>

      {error && <p className="mb-4 text-sm text-red-300">{error}</p>}

      {/* Форма добавления / редактирования */}
      <form
        onSubmit={onSubmit}
        className="mb-8 rounded-lg border border-white/10 bg-ink-800 p-5"
      >
        <div className="mb-3 font-semibold text-nbk-gold">
          {editingId === null ? 'Добавить новость' : `Редактирование #${editingId}`}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-white/70">
            Заголовок *
            <input className={inputCls} value={form.title} onChange={setField('title')} required />
          </label>
          <label className="text-sm text-white/70">
            Категория
            <input
              className={inputCls}
              value={form.category}
              onChange={setField('category')}
              placeholder="#Главное"
            />
          </label>
        </div>

        <label className="mt-4 block text-sm text-white/70">
          Краткое описание (excerpt)
          <input className={inputCls} value={form.excerpt} onChange={setField('excerpt')} />
        </label>

        <label className="mt-4 block text-sm text-white/70">
          Текст (body)
          <textarea
            className={`${inputCls} min-h-[100px] resize-y`}
            value={form.body}
            onChange={setField('body')}
          />
        </label>

        <label className="mt-4 block text-sm text-white/70">
          Ссылка на изображение (image_url)
          <input className={inputCls} value={form.image_url} onChange={setField('image_url')} />
        </label>

        <div className="mt-5 flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-ddc-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-ddc-blue-light disabled:opacity-60"
          >
            {saving ? 'Сохранение…' : editingId === null ? 'Добавить' : 'Сохранить'}
          </button>
          {editingId !== null && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:text-white"
            >
              Отмена
            </button>
          )}
        </div>
      </form>

      {/* Список новостей */}
      {loading ? (
        <p className="text-white/50">Загрузка…</p>
      ) : rows.length === 0 ? (
        <p className="text-white/50">Новостей пока нет.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-ink-800 text-white/60">
              <tr>
                <th className="px-4 py-3 font-medium">Дата</th>
                <th className="px-4 py-3 font-medium">Заголовок</th>
                <th className="px-4 py-3 font-medium">Категория</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {rows.map((n) => (
                <tr key={n.id} className="border-t border-white/5 align-top hover:bg-white/5">
                  <td className="whitespace-nowrap px-4 py-3 text-white/60">
                    {formatDate(n.published_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-white/90">{n.title}</div>
                    {n.excerpt && (
                      <div className="mt-0.5 max-w-md text-xs text-white/50">{n.excerpt}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-white/70">{n.category || '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => startEdit(n)}
                      className="mr-2 rounded-md border border-white/10 px-3 py-1 text-xs text-white/80 transition hover:border-ddc-blue-light hover:text-white"
                    >
                      Редактировать
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(n.id)}
                      className="rounded-md border border-white/10 px-3 py-1 text-xs text-white/80 transition hover:border-red-500/40 hover:text-red-300"
                    >
                      Удалить
                    </button>
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
