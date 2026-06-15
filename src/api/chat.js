import { API } from './config.js'

const FALLBACK =
  'Не удалось связаться с помощником. Попробуйте ещё раз или оставьте обращение через форму «Консультация» — мы свяжемся с вами.'

/**
 * Отправить сообщение помощнику DDC (POST /api/chat).
 *
 * Backend сам решает: гибрид FAQ + Groq (Llama 4 Scout). Ключ модели держится
 * на сервере и на фронт не попадает. Сюда возвращается готовый текст ответа.
 *
 * При сетевом сбое/ошибке не бросаем — возвращаем понятную заглушку,
 * чтобы чат не падал.
 *
 * @param {string} text сообщение пользователя
 * @param {Array<{from: string, text: string}>} [history] предыдущие реплики для контекста
 * @returns {Promise<string>} ответ помощника
 */
export async function sendMessage(text, history = []) {
  try {
    const res = await fetch(`${API}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, history }),
    })
    if (!res.ok) throw new Error(`Ошибка чата: ${res.status}`)
    const data = await res.json()
    return data.reply || FALLBACK
  } catch (err) {
    console.warn('[chat] backend недоступен:', err.message)
    return FALLBACK
  }
}

export default sendMessage
