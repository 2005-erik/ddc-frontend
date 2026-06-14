import { faq } from '../data/faq.js'

const FALLBACK =
  'Передаю вопрос специалисту… Вы также можете оставить обращение через форму «Консультация» — мы свяжемся с вами.'

/**
 * Отправить сообщение помощнику DDC.
 *
 * Гибрид на mock: ищем совпадение по ключевым словам в FAQ (src/data/faq.js).
 * Нашли — мгновенный ответ; не нашли — заглушка с переадресацией специалисту.
 * Небольшая задержка имитирует «печатает…».
 *
 * Позже здесь будет реальный бэкенд с ИИ — ключ модели держим на сервере, НЕ на фронте:
 *
 *   export async function sendMessage(text) {
 *     const res = await fetch('/api/chat', {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify({ message: text }),
 *     })
 *     if (!res.ok) throw new Error(`Ошибка чата: ${res.status}`)
 *     const data = await res.json()
 *     return data.reply
 *   }
 *
 * @param {string} text сообщение пользователя
 * @returns {Promise<string>} ответ помощника
 */
export async function sendMessage(text) {
  await new Promise((resolve) => setTimeout(resolve, 500))

  const q = text.toLowerCase()
  const hit = faq.find((item) => item.keywords.some((k) => q.includes(k)))
  return hit ? hit.answer : FALLBACK
}

export default sendMessage
