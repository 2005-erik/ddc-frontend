/**
 * Отправить заявку на услугу.
 *
 * Сейчас это мок с имитацией сетевой задержки (600 мс) — всегда успешно.
 *
 * Чтобы переключиться на реальный бэкенд — замените тело на:
 *
 *   export async function sendRequest(data) {
 *     const res = await fetch('/api/request', {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify(data),
 *     })
 *     if (!res.ok) throw new Error(`Не удалось отправить заявку: ${res.status}`)
 *     return res.json()
 *   }
 *
 * @param {{ service: string, name: string, contact: string, message: string }} data
 * @returns {Promise<{ ok: true }>}
 */
export async function sendRequest(data) {
  await new Promise((resolve) => setTimeout(resolve, 600))
  // здесь реальный API вернул бы созданную заявку; мок просто подтверждает приём
  console.info('[mock] заявка отправлена:', data)
  return { ok: true }
}

export default sendRequest
