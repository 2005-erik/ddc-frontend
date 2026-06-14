import { mockNews } from '../data/mockNews.js'

/**
 * Получить список новостей.
 *
 * Сейчас возвращает мок с имитацией сетевой задержки (400 мс).
 *
 * Чтобы переключиться на реальный бэкенд — замените тело на:
 *
 *   export async function fetchNews() {
 *     const res = await fetch('/api/news')
 *     if (!res.ok) throw new Error(`Не удалось загрузить новости: ${res.status}`)
 *     return res.json()
 *   }
 *
 * @returns {Promise<Array>} массив новостей
 */
export async function fetchNews() {
  await new Promise((resolve) => setTimeout(resolve, 400))
  return mockNews
}

export default fetchNews
