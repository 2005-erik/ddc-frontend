import { API } from './config.js'
import { mockNews } from '../data/mockNews.js'

/**
 * Привести новость из API к форме, которую ждут компоненты:
 * image_url → image, published_at → date.
 */
function normalize(n) {
  return {
    id: n.id,
    title: n.title,
    excerpt: n.excerpt,
    body: n.body,
    category: n.category,
    image: n.image_url,
    date: n.published_at,
  }
}

/**
 * Получить список новостей с backend (GET /api/news).
 *
 * При недоступности бэкенда (сеть/ошибка ответа) возвращаем mock,
 * чтобы страница не падала — лента всё равно отрисуется.
 *
 * @returns {Promise<Array>} массив новостей
 */
export async function fetchNews() {
  try {
    const res = await fetch(`${API}/api/news`)
    if (!res.ok) throw new Error(`Не удалось загрузить новости: ${res.status}`)
    const data = await res.json()
    return data.map(normalize)
  } catch (err) {
    console.warn('[news] backend недоступен, показываю mock:', err.message)
    return mockNews
  }
}

export default fetchNews
