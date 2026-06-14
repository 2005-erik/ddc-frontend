/**
 * Mock-функции «живого» канала поддержки (вне бота).
 * Задержка имитирует сеть; позже — реальный backend.
 */

/**
 * Срочное обращение к сотруднику поддержки.
 *
 * Реальный бэкенд:
 *   export async function sendSupport(data) {
 *     const res = await fetch('/api/support', {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify(data),
 *     })
 *     if (!res.ok) throw new Error(`Не удалось отправить обращение: ${res.status}`)
 *     return res.json()
 *   }
 *
 * @param {{ name: string, contact: string, message: string }} data
 * @returns {Promise<{ ok: true }>}
 */
export async function sendSupport(data) {
  await new Promise((resolve) => setTimeout(resolve, 600))
  console.info('[mock] срочное обращение в поддержку:', data)
  return { ok: true }
}

/**
 * Отзыв о сайте.
 *
 * Реальный бэкенд:
 *   export async function sendReview(data) {
 *     const res = await fetch('/api/review', {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify(data),
 *     })
 *     if (!res.ok) throw new Error(`Не удалось отправить отзыв: ${res.status}`)
 *     return res.json()
 *   }
 *
 * @param {{ rating: number, text: string }} data
 * @returns {Promise<{ ok: true }>}
 */
export async function sendReview(data) {
  await new Promise((resolve) => setTimeout(resolve, 600))
  console.info('[mock] отзыв о сайте:', data)
  return { ok: true }
}
