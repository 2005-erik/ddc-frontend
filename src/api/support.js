import { API } from './config.js'

/**
 * «Живой» канал поддержки и отзывы о сайте.
 * Оба пишутся в таблицу feedback на backend (POST /api/feedback),
 * различаются полем kind: 'поддержка' | 'отзыв'.
 */

/**
 * Срочное обращение к сотруднику поддержки.
 *
 * @param {{ name: string, contact: string, message: string }} data
 * @returns {Promise<object>}
 */
export async function sendSupport(data) {
  const res = await fetch(`${API}/api/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      kind: 'поддержка',
      name: data.name,
      contact: data.contact,
      message: data.message,
    }),
  })
  if (!res.ok) throw new Error(`Не удалось отправить обращение: ${res.status}`)
  return res.json()
}

/**
 * Отзыв о сайте (оценка + текст).
 * Маппинг на схему feedback: text → message, kind = 'отзыв'.
 *
 * @param {{ rating: number, text: string }} data
 * @returns {Promise<object>}
 */
export async function sendReview(data) {
  const res = await fetch(`${API}/api/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      kind: 'отзыв',
      rating: data.rating,
      message: data.text,
    }),
  })
  if (!res.ok) throw new Error(`Не удалось отправить отзыв: ${res.status}`)
  return res.json()
}
